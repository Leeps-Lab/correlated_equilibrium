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

    timeout_seconds = 10

    def is_displayed(self):
        return self.subsession.config is not None

    def vars_for_template(self):
        period_start = self.group.get_start_time()
        period_end = self.group.get_end_time()
        if None in (period_start, period_end):
            # I really don't like having to repeat these keys twice but I can't think of any clean way to avoid it
            return {
                'role_average_strategy': float('nan'),
                'my_average_strategy': float('nan'),
                'role_average_payoff': float('nan'),
            }
        decisions = self.group.get_group_decisions_events()

        role_payoffs = [ p.payoff for p in self.group.get_players() if p.role() == self.player.role() ]
        # keep role strategies in a dict so that my avg. strategy can be retrieved
        # prevents from having to compute my average strategy twice
        role_strategies = {
            p.participant.code: p.get_average_strategy(period_start, period_end, decisions)
            for p in self.group.get_players() if p.role() == self.player.role()
        }

        return {
            'role_average_strategy': sum(role_strategies.values()) / len(role_strategies),
            'my_average_strategy': role_strategies[self.participant.code],
            'role_average_payoff': sum(role_payoffs) / len(role_payoffs),
        }


page_sequence = [
    DecisionWaitPage,
    Decision,
    ResultsWaitPage,
    Results
]