from otree.api import (
    models, BaseConstants, BaseSubsession, BasePlayer
)

from django.contrib.contenttypes.models import ContentType
from otree_redwood.models import Event, DecisionGroup

import csv
import random
import math
import otree.common

doc = """
This is a configurable bimatrix game.
"""

class Constants(BaseConstants):
    name_in_url = 'correlated_equilibrium'
    players_per_group = None
    num_rounds = 50
    base_points = 0


def parse_config(config_file):
    with open('correlated_equilibrium/configs/' + config_file) as f:
        rows = list(csv.DictReader(f))

    rounds = []
    for row in rows:
        rounds.append({
            'round': int(row['round']),
            'shuffle_role': True if row['shuffle_role'] == 'TRUE' else False,
            'period_length': int(row['period_length']),
            'num_subperiods': int(row['num_subperiods']),
            'gamma': float(row['gamma']),
            'mean_matching': True if row['mean_matching'] == 'TRUE' else False,
            'max_info': True if row['max_info'] == 'TRUE' else False,
            'players_per_group': int(row['players_per_group']),
            'game': str(row['game']),
            'regret': int(row['regret']),
            'practice': True if row['practice'] == 'TRUE' else False,
        })
    return rounds

class Subsession(BaseSubsession):
    def num_rounds(self):
        return len(parse_config(self.session.config['config_file']))

    #get average strategy of role
    def get_average_strategy(self, p1, p2):
        role = 'p1' if p1 else 'p2' if p2 else 'p3'
        players = [p for p in self.get_players() if p.role() == role] 
        sum_strategies = 0
        for p in players:
            sum_strategies += p.get_average_strategy()
        return sum_strategies / len(players)

    #get average payoff of role
    def get_average_payoff(self, p1, p2):
        role = 'p1' if p1 else 'p2' if p2 else 'p3'
        players = [p for p in self.get_players() if p.role() == role] 
        sum_payoffs = 0
        for p in players:
            if not p.payoff:
                p.set_payoff()
            sum_payoffs += p.payoff
        return sum_payoffs / len(players)

    def payoff_matrix(self):
        game = parse_config(self.session.config['config_file'])[self.round_number-1]['game']

        if game == 'MV1':
            payoff_matrix = [
                [[0,0], [100,200], [200,100]],
                 [[200,100], [0,0], [100,200]],
                 [[100,200], [200,100], [0,0]]
            ]
        elif game == 'MV2':
            payoff_matrix = [
                [[200,100], [100,200], [0,0]],
                 [[0,0], [200,100], [100,200]],
                 [[100,200], [0,0], [200,100]]
            ]
        elif game == 'FP':
            payoff_matrix = [
                [[[0,100,300],[0,0,0]],
                    [[100,100,100],[100,0,0]]],
                [[[200,200,200], [0,0,0]],
                    [[200,200,0], [200,200,200]]],
                [[[0,100,0], [0,0,0]],
                    [[100,100,0], [100,0,300]]]
            ]
        elif game == 'BM1':
            #BM = Bimatrix
            payoff_matrix = [
                [[100,100],[600,200]],
                [[200,600],[500,500]]
            ]
        elif game == 'BM2':
            #BM = Bimatrix
            payoff_matrix = [
                [[500,500],[200,600]],
                [[600,200],[100,100]]
            ]
        return payoff_matrix
    
    def strat_matrix(self):
        game = parse_config(self.session.config['config_file'])[self.round_number-1]['game']

        if game == 'MV1' or game == 'MV2':
            strat_matrix = [
                [[], [], []],
                 [[], [], []],
                 [[], [], []]
            ]
        elif game == 'FP':
            strat_matrix = [
                [[ [  ], [  ] ], [ [  ], [  ]]],
                [[ [  ], [  ] ], [ [  ], [  ] ]],
                [[ [  ], [  ] ], [ [  ], [  ] ]]
            ]#BM = Bimatrix
        elif game == 'BM1' or game == 'BM2':
            strat_matrix = [
                [[ ], [ ]],
                [[ ], [ ]]
            ]
        return strat_matrix
    
    def game_type(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['game']
    
    def is_multi_dim(self):
        game = parse_config(self.session.config['config_file'])[self.round_number-1]['game']
        return game == 'FP'
    
    def practice(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['practice']

    def pure_strategy(self):
        return True
    
    def slider_rate_limit(self):
        return 0

    def creating_session(self):
        config = self.config
        if not config:
            return
        
        num_silos = self.session.config['num_silos']
        fixed_id_in_group = not config['shuffle_role']

        #print("num_silos: ", num_silos)

        players = self.get_players()
        num_players = len(players)
        #print("num_players: ", num_players)
        silos = [[] for _ in range(num_silos)]
        for i, player in enumerate(players):
            if self.round_number == 1:
                player.silo_num = math.floor(num_silos * i/num_players)
            else:
                player.silo_num = player.in_round(1).silo_num
            silos[player.silo_num].append(player)
        #print(silos)
        group_matrix = []
        for silo in silos:
            if config['mean_matching']:
                silo_matrix = [ silo ]
            else:
                silo_matrix = []
                ppg = self.config['players_per_group']
                for i in range(0, len(silo), ppg):
                    silo_matrix.append(silo[i:i+ppg])
            group_matrix.extend(otree.common._group_randomly(silo_matrix, fixed_id_in_group))
        #print(silo_matrix)
        #print(group_matrix)
        self.set_group_matrix(group_matrix)

    def set_initial_decisions(self):
        pure_strategy = True
        for player in self.get_players():
            if pure_strategy:
                player._initial_decision = random.choice([0, 1])
            else:
                player._initial_decision = random.choice([0, 1])
    
    @property
    def config(self):
        try:
            return parse_config(self.session.config['config_file'])[self.round_number-1]
        except IndexError:
            return None
    
    def set_payoffs(self):
        groups = self.get_groups()
        for group in groups:
            group.set_payoffs()

class Group(DecisionGroup):

    def num_subperiods(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['num_subperiods']

    def period_length(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['period_length']
    
    def rate_limit(self):
        if not self.subsession.pure_strategy() and self.mean_matching():
            return 0.2
        else:
            return None

    def set_payoffs(self):
        period_start = self.get_start_time()
        period_end = self.get_end_time()
        if None in (period_start, period_end):
            print('cannot set payoff, period has not ended yet')
            return
        #decisions = self.get_group_decisions_events()
        payoff_matrix = self.subsession.payoff_matrix()
        #for player in self.get_players():
        #    player.set_payoff(period_start, period_end, decisions, payoff_matrix)

        groups = self.subsession.get_groups()
        for group in groups:
            decisions = group.get_group_decisions_events()
            for player in group.get_players():
                if not player.payoff:
                    player.set_payoff(period_start, period_end, decisions, payoff_matrix)
    
    def _on_regret_event(self, event=None, **kwargs):
        print(event.value)
        self.save()



class Player(BasePlayer):

    silo_num = models.IntegerField()
    _initial_decision = models.IntegerField()
    C_payoff = models.FloatField()
    B_payoff = models.FloatField()
    A_payoff = models.FloatField()

    def role(self):
        num_players = self.num_players()
        if (num_players % 2 == 0):
            if (self.id_in_group - 1) % 2 == 0:
                return 'p1'
            elif (self.id_in_group - 1) % 2 == 1:
                return 'p2'
        elif ((num_players % 3 == 0)):
            if (self.id_in_group - 1) % 3 == 0:
                return 'p1'
            elif (self.id_in_group - 1) % 3 == 1:
                return 'p2'
            elif (self.id_in_group - 1) % 3 == 2:
                return 'p3'

    def get_average_strategy(self, period_start, period_end, decisions):
        weighted_sum_decision = 0
        while decisions:
            cur_decision = decisions.pop(0)
            next_change_time = decisions[0].timestamp if decisions else period_end
            decision_value = cur_decision.value[self.participant.code]
            weighted_sum_decision += decision_value * (next_change_time - cur_decision.timestamp).total_seconds()
        return weighted_sum_decision / self.group.period_length()

    #get frequency of player picking choice
    def get_frequency(self, choice, decisions):
        count = 0
        total = 0
        decisions = self.group.get_group_decisions_events()
        while decisions:
            cur_decision = decisions.pop(0)
            decision_value = cur_decision.value[self.participant.code]
            total += 1
            if (decision_value == choice):
                count += 1
        return count / total   
    
    #get average frequency of player's role picking choice
    def get_role_frequency(self, decisions):
        counts = [0, 0, 0]
        total = 0
        groups = self.group.subsession.get_groups()
        for group in groups:
            decisions = group.get_group_decisions_events()

            for i, d in enumerate(decisions):
                if not d.value: continue
                    
                role_decisions = [d.value[p.participant.code] for p in group.get_players() if p.role() == self.role()]
                for decision in role_decisions:
                    total += 1
                    if (int(decision) == 0):
                        counts[0] += 1
                    elif (int(decision) == 1):
                        counts[1] += 1
                    else:
                        counts[2] += 1
        counts[0] /= total
        counts[1] /= total
        counts[2] /= total
        return counts
    
    def initial_decision(self):
        return self._initial_decision


    def num_players(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['players_per_group']


    def other_player(self):
        return self.get_others_in_group()

    def set_payoff(self, period_start, period_end, decisions, payoff_matrix):
        period_duration = period_end - period_start

        payoff = 0
        calc_C_payoff = 0
        calc_B_payoff = 0
        calc_A_payoff = 0
        if(self.num_players() % 2 == 0):
            role_index = (self.id_in_group - 1) % 2 
        elif(self.num_players() % 3 == 0):
            role_index = (self.id_in_group - 1) % 3
        for i, d in enumerate(decisions):
            if not d.value: continue
                
            num_players = self.num_players()

            p1_decisions = [d.value[p.participant.code] for p in self.group.get_players() if p.role() == 'p1']
            p2_decisions = [d.value[p.participant.code] for p in self.group.get_players() if p.role() == 'p2']
            p3_decisions = [d.value[p.participant.code] for p in self.group.get_players() if p.role() == 'p3']
            
            other_role_decisions = [d.value[p.participant.code] for p in self.group.get_players() if p.role() != self.role()]
            
            flow_payoff = 0
            my_decision = d.value[self.participant.code]
            
            # update payoff conditional on player role
            if(num_players % 2 == 0):
                #If a 2 player game
                if self.role() == 'p1':
                    for p2 in p2_decisions:
                        flow_payoff += payoff_matrix[int(my_decision)][int(p2)][int(role_index)]
                elif self.role() == 'p2':
                    for p1 in p1_decisions:
                        flow_payoff += payoff_matrix[int(p1)][int(my_decision)][int(role_index)]

            elif(num_players % 3 == 0):
                #If a 3 player game
                if self.role() == 'p1':
                    for p2 in p2_decisions:
                        for p3 in p3_decisions:
                            flow_payoff += payoff_matrix[int(p3)][int(my_decision)][int(p2)][int(role_index)]
                elif self.role() == 'p2':
                    for p1 in p1_decisions:
                        for p3 in p3_decisions:
                            flow_payoff += payoff_matrix[int(p3)][int(p1)][int(my_decision)][int(role_index)]
                elif self.role() == 'p3':
                    for p1 in p1_decisions:
                        for p2 in p2_decisions:
                            flow_payoff += payoff_matrix[int(my_decision)][int(p1)][int(p2)][int(role_index)]
            
            #take the average conditional on group size, 2/3 populations share equal sizes.
            pop_size = len(p1_decisions)          
            if(num_players % 2 == 0):
                #If a 2 player game
                flow_payoff /= pop_size
            elif(num_players % 3 == 0):
                #If a 3 player game
                flow_payoff /= (pop_size*pop_size)

            if self.group.num_subperiods():
                if i == 0:
                    prev_change_time = period_start
                else:
                    prev_change_time = decisions[i - 1].timestamp
                decision_length = (d.timestamp - prev_change_time).total_seconds()
            else:
                if i + 1 < len(decisions):
                    next_change_time = decisions[i + 1].timestamp
                else:
                    next_change_time = period_end
                decision_length = (next_change_time - d.timestamp).total_seconds()
            payoff += decision_length * flow_payoff
            if (my_decision == 2):
                calc_C_payoff += decision_length * flow_payoff
            elif (my_decision == 1):
                calc_B_payoff += decision_length * flow_payoff
            else:
                calc_A_payoff += decision_length * flow_payoff

        self.C_payoff = calc_C_payoff / period_duration.total_seconds()
        self.B_payoff = calc_B_payoff / period_duration.total_seconds()
        self.A_payoff = calc_A_payoff / period_duration.total_seconds()
        self.payoff = payoff / period_duration.total_seconds()
        if self.group.subsession.practice():
            self.participant.payoff -= self.payoff
