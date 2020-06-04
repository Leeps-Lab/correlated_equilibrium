# oTree Bimatrix Experiments

bimatrix is an oTree app for a realtime bimatrix experiment. It supports both discrete and mixed strategies, as well as continuous and discrete time games.

bimatrix was built using [otree-redwood](https://github.com/Leeps-Lab/otree-redwood).

### Suggested session config:

```
dict(
    name='correlated_equilibrium',
    display_name='correlated_equilibrium Game',
    num_demo_participants=2,
    app_sequence=['correlated_equilibrium'],
    config_file='demo.csv',
    num_silos=1,
),
```