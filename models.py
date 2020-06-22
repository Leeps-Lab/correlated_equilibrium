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
    players_per_group = 2
    num_rounds = 50
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
            'gamma': float(row['gamma']),
            'mean_matching': True if row['mean_matching'] == 'TRUE' else False,
            'max_info': True if row['max_info'] == 'TRUE' else False,
            'players_per_group': int(row['players_per_group']),
            'game': str(row['game'])
        })
    return rounds

class Subsession(BaseSubsession, SubsessionSilosMixin):

    def get_average_strategy(self, p1, p2):
        role = 'p1' if p1 else 'p2' if p2 else 'p3'
        players = [p for p in self.get_players() if p.role() == role] 
        sum_strategies = 0
        for p in players:
            sum_strategies += p.get_average_strategy()
        return sum_strategies / len(players)
    
    def get_average_payoff(self, p1, p2):
        role = 'p1' if p1 else 'p2' if p2 else 'p3'
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
        #return parse_config(self.session.config['config_file'])[self.round_number-1]['payoff_matrix']
        game = parse_config(self.session.config['config_file'])[self.round_number-1]['game']
        if game == 'MV':
            payoff_matrix = [
                [[0,0], [100,200], [200,100]],
                 [[200,100], [0,0], [100,200]],
                 [[100,200], [200,100], [0,0]]
            ]
            return payoff_matrix
        else:
            if game == 'FP':
                payoff_matrix = [
                    [[[0,100,300],[0,0,0]],
                     [[100,100,100],[100,0,0]]],
                    [[[200,200,200], [0,0,0]],
                     [[200,200,0], [200,200,200]]],
                    [[[0,100,0], [0,0,0]],
                     [[100,100,0], [100,0,300]]]
                ]
                return payoff_matrix
            else:
                payoff_matrix = [
                    [[100,100],[600,200]],
                    [[200,600],[500,500]]
                ]
                return payoff_matrix

    def pure_strategy(self):
        return True
        #return parse_config(self.session.config['config_file'])[self.round_number-1]['pure_strategy']
    
    def show_at_worst(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['show_at_worst']

    def show_best_response(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['show_best_response']
    
    def slider_rate_limit(self):
        return 0

    def creating_session(self):
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

        # if pairwise matching, set group size based on config
        else:
            players = self.get_players()
            players_per_silo = math.ceil(len(players) / num_silos)
            group_matrix = []
            ppg = config[self.round_number-1]['players_per_group']
            for i in range(0, players_per_silo, ppg):
                group_matrix.append(players[i:i+ppg])
            self.set_group_matrix(group_matrix)

        # randomize player id each period if not fixed id
        fixed_id_in_group = not config[self.round_number-1]['shuffle_role']

        # use otree-redwood's SubsessionSilosMixin to organize the session into silos
        self.group_randomly_in_silos(num_silos, fixed_id_in_group)

        '''
        group_matrix = []
        players = self.get_players()
        ppg = self.session.config['players_per_group']
        for i in range(0, len(players), ppg):
            group_matrix.append(players[i:i+ppg])
        self.set_group_matrix(group_matrix)
        '''


class Group(DecisionGroup, GroupSilosMixin):

    def num_rounds(self):
        return len(parse_config(self.session.config['config_file']))

    def num_subperiods(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['num_subperiods']

    def period_length(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['period_length']
    
    def mean_matching(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['mean_matching']

    def max_info(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['max_info']

    def game(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['game']

    def gamma(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['gamma']

    def player_per_group(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['players_per_group']
    
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
        if (self.id_in_group - 1) % 3 == 0:
            return 'p1'
        elif (self.id_in_group - 1) % 3 == 1:
            return 'p2'
        elif (self.id_in_group - 1) % 3 == 2:
            return 'p3'

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
        return self.get_others_in_group()

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
        role_index = (self.id_in_group - 1) % 3 

        for i, d in enumerate(decisions):
            if not d.value: continue

            other_role_decisions = [d.value[p.participant.code] for p in self.group.get_players() if
                                        p.role() != self.role()]
            
            flow_payoff = 0
            my_decision = d.value[self.participant.code]

            for decision in other_role_decisions:
                if self.role() == 'p1':
                    flow_payoff += payoff_matrix[my_decision][decision][role_index]
                else:
                    flow_payoff += payoff_matrix[decision][my_decision][role_index]

            flow_payoff /= len(other_role_decisions)

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
    