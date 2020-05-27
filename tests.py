from collections import namedtuple
from otree.api import Bot, Submission
from . import views


class PlayerBot(Bot):

    def play_round(self):
        if self.player.round_number == 1:
            yield views.Introduction
        if self.player.round_number <= self.group.num_rounds():
            test_get_payoff()
            yield Submission(views.Decision, {}, check_html=False)
            yield views.Results


    def validate_play(self):
        assert self.payoff == 0


def test_get_payoff():
    '''
        Test the get_payoff function for the Player model.

        Initializes a session, participants, etc, then creates mock events.
    '''
    from otree_redwood.models import Event
    from otree.models.participant import Participant
    from otree.models.session import Session
    import random
    from django.utils import timezone
    from . import models

    sess = Session.objects.create(code=str(random.randint(0, 500000)), config={
        'config_file': 'demo.csv',
    })
    p1 = Participant.objects.create(session=sess, code='test_p1_'+str(random.randint(0, 500000)))
    p2 = Participant.objects.create(session=sess, code='test_p2_'+str(random.randint(0, 500000)))
    start = timezone.now()

    MockEvent = namedtuple('Event', ['channel', 'value', 'participant', 'timestamp'])
    decisions = []

    period_start = MockEvent('state', 'period_start', p1, start+timezone.timedelta(seconds=0))

    decisions.append(MockEvent('decisions', 0.5, p1, start+timezone.timedelta(seconds=0)))
    decisions.append(MockEvent('decisions', 0.5, p2, start+timezone.timedelta(seconds=0)))
 
    decisions.append(MockEvent('decisions', 0.8, p2, start+timezone.timedelta(seconds=5)))
    decisions.append(MockEvent('decisions', 0.9, p1, start+timezone.timedelta(seconds=10)))
    decisions.append(MockEvent('decisions', 0.4, p1, start+timezone.timedelta(seconds=18)))
    decisions.append(MockEvent('decisions', 0.7, p1, start+timezone.timedelta(seconds=20)))

    period_end = MockEvent('state', 'period_end', p1, start+timezone.timedelta(seconds=30))

    payoff_grid = [
        [ 100, 100 ], [   0, 800 ],
        [ 800,   0 ], [ 300, 300 ]
    ]

    subsession = models.Subsession.objects.create(session=sess, round_number=1)
    player1 = models.Player.objects.create(session=sess, subsession=subsession, participant=p1, id_in_group=1)
    player2 = models.Player.objects.create(session=sess, subsession=subsession, participant=p2, id_in_group=2)
    group = models.Group.objects.create(session=sess, subsession=subsession)
    # player_set isn't part of the group model, not actually sure how it's assigned in oTree
    # but it's required to tell row players and column players apart.
    group.player_set = { player1, player2 }
    player1.group, player2.group = group, group

    payoff1 = player1.get_payoff(period_start, period_end, decisions, payoff_grid)
    payoff2 = player2.get_payoff(period_start, period_end, decisions, payoff_grid)

    assert 0 <= payoff1 and payoff1 <= 800
    assert 0 <= payoff2 and payoff2 <= 800
    assert abs(payoff1 - 271) < 1
    assert abs(payoff2 - 205) < 1