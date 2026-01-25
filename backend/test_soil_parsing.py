test_cases = [
    'soil_black_soil', 
    'soil_red_soil', 
    'soil_laterite_soil', 
    'soil_alluvial_soil', 
    'soil_saline_alkaline_soil'
]

print('Testing soil column name parsing:')
print('-' * 50)
for col in test_cases:
    soil_name = col.replace('soil_', '', 1)
    print(f'{col:30} -> {soil_name}')

print('\n' + '=' * 50)
print('Testing with input values:')
print('=' * 50)

input_values = ['black_soil', 'red_soil', 'laterite_soil', 'alluvial_soil', 'saline_alkaline_soil']

for input_val in input_values:
    print(f'\nInput: {input_val}')
    matches = []
    for col in test_cases:
        soil_name = col.replace('soil_', '', 1)
        if input_val.lower() == soil_name.lower():
            matches.append(col)
    print(f'  Matches: {matches}')
