# oTree Correlated Equilibrium Experiments

Correlated Equilibrium is an oTree app for a realtime Correlated Equilibrium experiment. It supports both discrete and mixed strategies, as well as continuous and discrete time games.

Correlated Equilibrium was built using [otree-redwood](https://github.com/Leeps-Lab/otree-redwood).

### Suggested session config:

```
dict(
        name='correlated_equilibrium',
        display_name='correlated_equilibrium Game',
        num_demo_participants=3,
        app_sequence=['correlated_equilibrium', 'payment_info'],
        config_file='pilot_test.csv',
        num_silos=1,
     ),
```
