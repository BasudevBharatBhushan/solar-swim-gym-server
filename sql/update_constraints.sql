ALTER TABLE membership_plans
DROP CONSTRAINT IF EXISTS membership_plans_age_group_check;

ALTER TABLE membership_plans
ADD CONSTRAINT membership_plans_age_group_check
CHECK (
    age_group IN (
        'Individual',
        'Individual Plus',
        'Senior (65+)',
        'Adult (18+)',
        'Teen (13–17)',
        'Child (6–12)',
        'Infant (0–5)'
    )
);

ALTER TABLE service_plans
DROP CONSTRAINT IF EXISTS service_plans_age_group_check;

ALTER TABLE service_plans
ADD CONSTRAINT service_plans_age_group_check
CHECK (
    age_group IN (
        'Individual',
        'Individual Plus',
        'Senior (65+)',
        'Adult (18+)',
        'Teen (13–17)',
        'Child (6–12)',
        'Infant (0–5)'
    )
);
