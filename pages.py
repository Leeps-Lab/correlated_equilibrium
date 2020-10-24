import math
from ._builtin import Page, WaitPage

from datetime import timedelta
from operator import concat
from functools import reduce
from .models import parse_config

class Introduction(Page):

    def is_displayed(self):
        return self.round_number == 1


class DecisionWaitPage(WaitPage):

    body_text = 'Waiting for all players to be ready'
    wait_for_all_groups = True
    after_all_players_arrive = 'set_initial_decisions'

    def is_displayed(self):
        return self.subsession.config is not None


class Decision(Page):

    def is_displayed(self):
        return self.subsession.config is not None


class ResultsWaitPage(WaitPage):
    wait_for_all_groups = True

    after_all_players_arrive = 'set_payoffs'

    def is_displayed(self):
        return self.subsession.config is not None


class Results(Page):

    timeout_seconds = 20

    def is_displayed(self):
        return self.subsession.config is not None

    def vars_for_template(self):
        period_start = self.group.get_start_time()
        period_end = self.group.get_end_time()
        if None in (period_start, period_end):
            # I really don't like having to repeat these keys twice but I can't think of any clean way to avoid it
            return {
                'role_average_payoff': float('nan'),
                'role_average_C_payoff': float('nan'),
                'role_average_B_payoff': float('nan'),
                'role_average_A_payoff': float('nan'),
                'freq_C': float('nan'),
                'freq_B': float('nan'),
                'freq_A': float('nan'),
                'role_freq_C': float('nan'),
                'role_freq_B': float('nan'),
                'role_freq_A': float('nan'),
                'role': 'none',
                'show_C': False,
            }
        decisions = self.group.get_group_decisions_events()

        role_payoffs = [ p.payoff for p in self.group.subsession.get_players() if p.role() == self.player.role() ]
        role_C_payoffs = [ p.C_payoff for p in self.group.subsession.get_players() if p.role() == self.player.role() ]
        role_B_payoffs = [ p.B_payoff for p in self.group.subsession.get_players() if p.role() == self.player.role() ]
        role_A_payoffs = [ p.A_payoff for p in self.group.subsession.get_players() if p.role() == self.player.role() ]
        

        role_average_frequencies = self.player.get_role_frequency(decisions)

        freq_C = self.player.get_frequency( 2, decisions)
        freq_B = self.player.get_frequency( 1, decisions)
        freq_A = self.player.get_frequency( 0, decisions)


        return {
            'C_payoff': round(self.player.C_payoff / freq_C) if freq_C else 0,
            'B_payoff': round(self.player.B_payoff / freq_B) if freq_B else 0,
            'A_payoff': round(self.player.A_payoff / freq_A) if freq_A else 0,
            'role_average_payoff': round(sum(role_payoffs) / len(role_payoffs)),
            'role_average_C_payoff': round((round(sum(role_C_payoffs) / len(role_C_payoffs)) / role_average_frequencies[2])) if role_average_frequencies[2] else 0,
            'role_average_B_payoff': round((round(sum(role_B_payoffs) / len(role_B_payoffs)) / role_average_frequencies[1])) if role_average_frequencies[1] else 0,
            'role_average_A_payoff': round((round(sum(role_A_payoffs) / len(role_A_payoffs)) / role_average_frequencies[0])) if role_average_frequencies[0] else 0,
            'freq_C': freq_C,
            'freq_B': freq_B,
            'freq_A': freq_A,
            'role_freq_C': role_average_frequencies[2],
            'role_freq_B': role_average_frequencies[1],
            'role_freq_A': role_average_frequencies[0],
            'role': self.player.role(),
            'game': self.group.subsession.game_type(),
            'show_C': (self.player.role() == 'p3') or (self.group.subsession.game_type() == 'MV1') or (self.group.subsession.game_type() == 'MV2')
        }

class Payment(Page):

    def is_displayed(self):
        return self.round_number == self.subsession.num_rounds()
    
    def vars_for_template(self):
        return {
            'payoff': self.participant.payoff.to_real_world_currency(self.session),
        }

page_sequence = [
    Introduction,
    DecisionWaitPage,
    Decision,
    ResultsWaitPage,
    Results,
    Payment
]
