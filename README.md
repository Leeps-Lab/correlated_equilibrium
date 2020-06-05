# oTree Bimatrix Experiments

bimatrix is an oTree app for a realtime bimatrix experiment. It supports both discrete and mixed strategies, as well as continuous and discrete time games.

bimatrix was built using [otree-redwood](https://github.com/Leeps-Lab/otree-redwood).

### Suggested session config:

```
<<<<<<< HEAD
dict(
    name='bimatrix',
    display_name='Generic Bimatrix Game',
    num_demo_participants=2,
    app_sequence=['bimatrix'],
    config_file='demo.csv',
    num_silos=1,
),
=======
{
    'name': 'bimatrix',
    'display_name': "Generic Bimatrix Game",
    'num_demo_participants': 2,
    'app_sequence': ['bimatrix', 'payment_info'],
    'config_file': 'demo.csv',
    'num_silos': 1,
}
>>>>>>> parent of d4d50de... Get most recent bimatrix code
```