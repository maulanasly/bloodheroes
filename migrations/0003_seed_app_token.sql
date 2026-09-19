INSERT INTO app_tokens (token, name, active) VALUES
    ('dev-app-token-change-me', 'development default - rotate in production', TRUE)
ON CONFLICT (token) DO NOTHING;
