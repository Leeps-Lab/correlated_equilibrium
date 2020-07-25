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

    after_all_players_arrive = 'set_payoffs'

    def is_displayed(self):
        return self.subsession.config is not None


class Results(Page):

    timeout_seconds = 180

    def is_displayed(self):
        return self.subsession.config is not None

    def vars_for_template(self):
        period_start = self.group.get_start_time()
        period_end = self.group.get_end_time()
        if None in (period_start, period_end):
            # I really don't like having to repeat these keys twice but I can't think of any clean way to avoid it
            return {
                'role_average_payoff': float('nan'),
                'role_average_u_payoff': float('nan'),
                'role_average_c_payoff': float('nan'),
                'role_average_d_payoff': float('nan'),
                'freq_u': float('nan'),
                'freq_c': float('nan'),
                'freq_d': float('nan'),
                'role_freq_u': float('nan'),
                'role_freq_c': float('nan'),
                'role_freq_d': float('nan'),
                'role': 'none'
            }
        decisions = self.group.get_group_decisions_events()

        role_payoffs = [ p.payoff for p in self.group.get_players() if p.role() == self.player.role() ]
        role_u_payoffs = [ p.u_payoff for p in self.group.get_players() if p.role() == self.player.role() ]
        role_c_payoffs = [ p.c_payoff for p in self.group.get_players() if p.role() == self.player.role() ]
        role_d_payoffs = [ p.d_payoff for p in self.group.get_players() if p.role() == self.player.role() ]
        

        role_average_frequencies = self.player.get_role_frequency(decisions)

        return {
            'role_average_payoff': sum(role_payoffs) / len(role_payoffs),
            'role_average_u_payoff': round(sum(role_u_payoffs) / len(role_u_payoffs)),
            'role_average_c_payoff': round(sum(role_c_payoffs) / len(role_c_payoffs)),
            'role_average_d_payoff': round(sum(role_d_payoffs) / len(role_d_payoffs)),
            'freq_u': self.player.get_frequency( 2, decisions),
            'freq_c': self.player.get_frequency( 1, decisions),
            'freq_d': self.player.get_frequency( 0, decisions),
            'role_freq_u': role_average_frequencies[2],
            'role_freq_c': role_average_frequencies[1],
            'role_freq_d': role_average_frequencies[0],
            'role': self.player.role()
        }


page_sequence = [
    DecisionWaitPage,
    Decision,
    ResultsWaitPage,
    Results
]