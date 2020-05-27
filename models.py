import csv
import random
import math

from django.contrib.contenttypes.models import ContentType
from otree.constants import BaseConstants
from otree.models import BasePlayer, BaseSubsession
from django.db.models import FloatField

from otree_redwood.models import Event, DecisionGroup
from otree_redwood.mixins import SubsessionSilosMixin, GroupSilosMixin

doc = """
This is a configurable bimatrix game.
"""


class Constants(BaseConstants):
    name_in_url = 'correlated_equilibrium'
    # players per group when not using mean matching
    players_per_group = 2
	# Maximum number of rounds, actual number is taken as the max round
	# in the config file.
    num_rounds = 100
    base_points = 0


def parse_config(config_file):
    with open('correlated_equilibrium/configs/' + config_file) as f:
        rows = list(csv.DictReader(f))

    rounds = []
    for row in rows:
        rounds.append({
            'shuffle_role': True if row['shuffle_role'] == 'TRUE' else False,
            'period_length': int(row['period_length']),
            'num_subperiods': int(row['num_subperiods']),
            'pure_strategy': True if row['pure_strategy'] == 'TRUE' else False,
            'show_at_worst': True if row['show_at_worst'] == 'TRUE' else False,
            'show_best_response': True if row['show_best_response'] == 'TRUE' else False,
            'rate_limit': int(row['rate_limit']) if row['rate_limit'] else 0,
            'mean_matching': True if row['mean_matching'] == 'TRUE' else False,
            'payoff_matrix': [
                [int(row['payoff1Aa']), int(row['payoff2Aa'])], [int(row['payoff1Ab']), int(row['payoff2Ab'])],
                [int(row['payoff1Ba']), int(row['payoff2Ba'])], [int(row['payoff1Bb']), int(row['payoff2Bb'])]
            ],
        })
    return rounds


class Subsession(BaseSubsession, SubsessionSilosMixin):

    def get_average_strategy(self, row_player):
        role = 'row' if row_player else 'column'
        players = [p for p in self.get_players() if p.role() == role] 
        sum_strategies = 0
        for p in players:
            sum_strategies += p.get_average_strategy()
        return sum_strategies / len(players)
    
    def get_average_payoff(self, row_player):
        role = 'row' if row_player else 'column'
        players = [p for p in self.get_players() if p.role() == role] 
        sum_payoffs = 0
        for p in players:
            if not p.payoff:
                p.set_payoff()
            sum_payoffs += p.payoff
        return sum_payoffs / len(players)

    def before_session_starts(self):
        config = parse_config(self.session.config['config_file'])
        if self.round_number > len(config):
            return
        
        num_silos = self.session.config['num_silos']

        # if mean matching is enabled, put everyone in the same silo in the same group
        if config[self.round_number-1]['mean_matching']:
            players = self.get_players()
            players_per_silo = math.ceil(len(players) / num_silos)
            group_matrix = []
            for i in range(0, len(players), players_per_silo):
                group_matrix.append(players[i:i+players_per_silo])
            self.set_group_matrix(group_matrix)

        fixed_id_in_group = not config[self.round_number-1]['shuffle_role']
        # use otree-redwood's SubsessionSilosMixin to organize the session into silos
        self.group_randomly_in_silos(num_silos, fixed_id_in_group)

    def payoff_matrix(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['payoff_matrix']

    def pure_strategy(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['pure_strategy']
    
    def show_at_worst(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['show_at_worst']

    def show_best_response(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['show_best_response']
    
    def slider_rate_limit(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['rate_limit']


class Group(DecisionGroup, GroupSilosMixin):

    def num_rounds(self):
        return len(parse_config(self.session.config['config_file']))

    def num_subperiods(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['num_subperiods']

    def period_length(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['period_length']
    
    def mean_matching(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['mean_matching']
    
    def rate_limit(self):
        if not self.subsession.pure_strategy() and self.mean_matching():
            return 0.2
        else:
            return None


class Player(BasePlayer):

    # store generated initial decision so that if player.initial_decision is called
    # more than once, it always returns the same value
    _initial_decision = FloatField(null=True)

    def role(self):
        if self.id_in_group % 2 == 0:
            return 'column'
        else:
            return 'row'

    def get_average_strategy(self):
        decisions = list(Event.objects.filter(
                channel='group_decisions',
                content_type=ContentType.objects.get_for_model(self.group),
                group_pk=self.group.pk).order_by("timestamp"))
        try:
            period_end = Event.objects.get(
                    channel='state',
                    content_type=ContentType.objects.get_for_model(self.group),
                    group_pk=self.group.pk,
                    value='period_end').timestamp
        except Event.DoesNotExist:
            return float('nan')
        # sum of all decisions weighted by the amount of time that decision was held
        weighted_sum_decision = 0
        while decisions:
            cur_decision = decisions.pop(0)
            next_change_time = decisions[0].timestamp if decisions else period_end
            decision_value = cur_decision.value[self.participant.code]
            weighted_sum_decision += decision_value * (next_change_time - cur_decision.timestamp).total_seconds()
        return weighted_sum_decision / self.group.period_length()

    def initial_decision(self):
        self.refresh_from_db()
        if self._initial_decision:
            return self._initial_decision
        if self.subsession.pure_strategy():
            self._initial_decision = random.choice([0, 1])
        else:
            self._initial_decision = random.random()
        self.save(update_fields=['_initial_decision'])
        return self._initial_decision

    def other_player(self):
        return self.get_others_in_group()[0]

    def set_payoff(self):
        decisions = list(Event.objects.filter(
                channel='group_decisions',
                content_type=ContentType.objects.get_for_model(self.group),
                group_pk=self.group.pk).order_by("timestamp"))

        try:
            period_start = Event.objects.get(
                    channel='state',
                    content_type=ContentType.objects.get_for_model(self.group),
                    group_pk=self.group.pk,
                    value='period_start')
            period_end = Event.objects.get(
                    channel='state',
                    content_type=ContentType.objects.get_for_model(self.group),
                    group_pk=self.group.pk,
                    value='period_end')
        except Event.DoesNotExist:
            return float('nan')

        payoff_matrix = self.subsession.payoff_matrix()

        self.payoff = self.get_payoff(period_start, period_end, decisions, payoff_matrix)

    def get_payoff(self, period_start, period_end, decisions, payoff_matrix):
        period_duration = period_end.timestamp - period_start.timestamp

        payoff = 0
        role_index = 0 if self.role() == 'row' else 1

        Aa = payoff_matrix[0][role_index]
        Ab = payoff_matrix[1][role_index]
        Ba = payoff_matrix[2][role_index]
        Bb = payoff_matrix[3][role_index]

        q1, q2 = 0.5, 0.5
        for i, d in enumerate(decisions):
            if not d.value: continue

            other_role_decisions = [d.value[p.participant.code] for p in self.group.get_players() if p.role() != self.role()]
            if self.role() == 'row':
                q1 = d.value[self.participant.code]
                q2 = sum(other_role_decisions) / len(other_role_decisions)
            else:
                q2 = d.value[self.participant.code]
                q1 = sum(other_role_decisions) / len(other_role_decisions)

            flow_payoff = ((Aa * q1 * q2) +
                           (Ab * q1 * (1 - q2)) +
                           (Ba * (1 - q1) * q2) +
                           (Bb * (1 - q1) * (1 - q2)))

            if self.group.num_subperiods():
                if i == 0:
                    prev_change_time = period_start.timestamp
                else:
                    prev_change_time = decisions[i - 1].timestamp
                decision_length = (d.timestamp - prev_change_time).total_seconds()
            else:
                if i + 1 < len(decisions):
                    next_change_time = decisions[i + 1].timestamp
                else:
                    next_change_time = period_end.timestamp
                decision_length = (next_change_time - d.timestamp).total_seconds()
            payoff += decision_length * flow_payoff
        return payoff / period_duration.total_seconds()
    