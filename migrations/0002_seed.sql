INSERT INTO blood_types (name, description) VALUES
    ('A+', 'A positive'),
    ('A-', 'A negative'),
    ('B+', 'B positive'),
    ('B-', 'B negative'),
    ('AB+', 'AB positive'),
    ('AB-', 'AB negative'),
    ('O+', 'O positive'),
    ('O-', 'O negative')
ON CONFLICT (name) DO NOTHING;

INSERT INTO user_levels (level_id, name, min_score) VALUES
    (1, 'Bronze', 0),
    (2, 'Silver', 5),
    (3, 'Gold', 10),
    (4, 'Platinum', 20),
    (5, 'Diamond', 50)
ON CONFLICT (level_id) DO NOTHING;
