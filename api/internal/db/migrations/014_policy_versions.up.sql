CREATE TABLE policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    version VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE policy_acceptances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_version_id UUID NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, policy_version_id)
);

CREATE INDEX idx_policy_acceptances_user ON policy_acceptances (user_id);
CREATE INDEX idx_policy_acceptances_version ON policy_acceptances (policy_version_id);

INSERT INTO policy_versions (id, title, version, content, effective_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Code of Conduct',
    '1.0',
    '# Malkia Mentor Code of Conduct

## Our Pledge
We pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

## Our Standards
Examples of behavior that contributes to creating a positive environment include:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior include:
- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others'' private information, such as a physical or electronic address, without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Safeguarding
Malkia Mentor takes the safety of minors seriously. All mentors working with mentees under 18 must have guardian consent on file and must complete safeguarding training. Any safeguarding concerns should be reported immediately through the in-app reporting mechanism.

## Enforcement
Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the platform administrators. All complaints will be reviewed and investigated promptly.

This Code of Conduct is adapted from the Contributor Covenant, version 1.4.',
    NOW()
), (
    '22222222-2222-2222-2222-222222222222',
    'Safeguarding Policy',
    '1.0',
    '# Malkia Mentor Safeguarding Policy

## Purpose
This policy outlines how Malkia Mentor protects children and young people (under 18) who use our platform.

## Principles
- The welfare of the child is paramount
- All children, regardless of age, disability, gender, racial heritage, religious belief, sexual orientation, or identity, have the right to equal protection from harm
- Working in partnership with children, their parents, carers, and guardians is essential

## Mentor Requirements for Working with Minors
1. Guardian consent must be obtained and recorded before any mentorship with a minor begins
2. Mentors working with minors must complete safeguarding training
3. All sessions with minors must be conducted through the platform''s recorded session system
4. Mentors must not communicate with minors outside the platform

## Reporting Concerns
Any safeguarding concern should be reported immediately:
- Use the in-app report function to flag a user
- Contact platform administrators directly
- In cases of immediate danger, contact local authorities

All reports are treated confidentially and investigated by trained staff.

## Data Protection
Data about minors is collected only with guardian consent and is stored securely with limited access.

This Safeguarding Policy is reviewed annually.',
    NOW()
);
