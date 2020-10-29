from datetime import timedelta
from operator import concat
from functools import reduce
from .models import parse_config
import math

def get_config_columns(group):
    config = parse_config(group.session.config['config_file'])[group.round_number - 1]
    #payoffs = config['payoff_matrix']
    #payoffs = reduce(concat, payoffs)

    return [
        config['round'],
        config['shuffle_role'],
        config['period_length'],
        config['num_subperiods'],
        config['gamma'],
        config['mean_matching'],
        config['max_info'],
        config['players_per_group'],
        config['game'],
        config['regret'],
        config['practice']
    ]

def get_output_table_header(groups):
    num_silos = groups[0].session.config['num_silos']
    max_num_players = max(len(g.get_players()) for g in groups)

    header = [
        'round',
        'shuffle_role',
        'period_length',
        'num_subperiods',
        'gamma',
        'mean_matching',
        'max_info',
        'players_per_group',
        'game',
        'regret',
        'practice'
    ]

    header += [
        'session_code',
        'subsession_id',
        'id_in_subsession',
        'tick',
    ]

    for player_num in range(1, max_num_players + 1):
        header.append('p{}_code'.format(player_num))
        header.append('p{}_role'.format(player_num))
        header.append('p{}_strategy'.format(player_num))
        header.append('p{}_regret0'.format(player_num))
        header.append('p{}_regret1'.format(player_num))
        header.append('p{}_regret2'.format(player_num))
        header.append('p{}_target'.format(player_num))
    
    return header


def get_output_table(events):
    if not events:
        return []
    if events[0].group.num_subperiods() == 0:
        return get_output_cont_time(events)
    else:
        return get_output_discrete_time(events)


# build output for a round of continuous time bimatrix
def get_output_cont_time(events):
    rows = []
    minT = min(e.timestamp for e in events if e.channel == 'state')
    maxT = max(e.timestamp for e in events if e.channel == 'state')
    group = events[0].group
    players = group.get_players()
    max_num_players = math.ceil(group.session.num_participants / group.session.config['num_silos'])
    config_columns = get_config_columns(group)
    # sets sampling frequency
    ticks_per_second = 2
    decisions = {p.participant.code: float('nan') for p in players}
    targets = {p.participant.code: float('nan') for p in players}
    for tick in range((maxT - minT).seconds * ticks_per_second):
        currT = minT + timedelta(seconds=(tick / ticks_per_second))
        cur_decision_event = None
        while events[0].timestamp <= currT:
            e = events.pop(0)
            if e.channel == 'group_decisions':
                cur_decision_event = e
            elif e.channel == 'target':
                targets[e.participant.code] = e.value
        if cur_decision_event:
            decisions.update(cur_decision_event.value)
        row = config_columns
        row += [
            group.session.code,
            group.subsession_id,
            group.id_in_subsession,
            tick,
        ]
        for player_num in range(max_num_players):
            if player_num >= len(players):
                row += ['', '', '', '']
            else:
                pcode = players[player_num].participant.code
                row += [
                    pcode,
                    players[player_num].role(),
                    decisions[pcode],
                    targets[pcode],
                ]
        rows.append(row)
    return rows


# build output for a round of discrete time bimatrix
def get_output_discrete_time(events):
    rows = []
    regret_dict = {}
    for event in events:
        if event.channel == 'regret':
            pcode = event.value['pcode']
            if pcode not in regret_dict.keys():
                regret_dict[pcode] = {}
                regret_dict[pcode][event.value['tick']] = (event.value)
            else:
                regret_dict[pcode][event.value['tick']] = (event.value)

    players = events[0].group.get_players()
    group = events[0].group
    max_num_players = math.ceil(group.session.num_participants / group.session.config['num_silos'])
    config_columns = get_config_columns(group)
    
    tick = 0


    targets = {p.participant.code: float('nan') for p in players}
    for event in events:
        if event.channel == 'target':
            targets[event.participant.code] = event.value
        elif event.channel == 'group_decisions':
            row = []
            row += config_columns
            row += [
                group.session.code,
                group.subsession_id,
                group.id_in_subsession,
                tick,
            ]
            for player_num in range(max_num_players):
                if player_num >= len(players):
                    row += ['', '', '', '']
                else:
                    pcode = players[player_num].participant.code
                    if tick == 0:
                        row += [
                            pcode,
                            players[player_num].role(),
                            event.value[pcode],
                            0,
                            0,
                            0,
                            targets[pcode],
                        ]
                    elif tick in regret_dict[pcode].keys():
                        row += [
                            pcode,
                            players[player_num].role(),
                            event.value[pcode],
                            regret_dict[pcode][tick]['regret0'],
                            regret_dict[pcode][tick]['regret1'],
                            regret_dict[pcode][tick]['regret2'],
                            targets[pcode],
                        ]
                    else:
                        row += [
                            pcode,
                            players[player_num].role(),
                            event.value[pcode],
                            'error',
                            'error',
                            'error',
                            targets[pcode],
                        ]
            
            rows.append(row)
            tick += 1
    return rows
