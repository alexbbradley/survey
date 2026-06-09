<?php

/**
 * Rules to Protect — Branding & Website Questionnaire
 * URL: /?s=rules-to-protect-survey
 */
return [
    'title'       => 'Rules to Protect — Branding & Website Questionnaire',
    'description' => 'We\'re shaping the new visual identity and website for Rules to Protect.

This questionnaire helps us understand how the identity and website should support the campaign, the coalition partners and the wider movement. Responses will be used to identify overall themes and won\'t be attributed to individuals.

This should take 10-15 minutes. Thanks for your time.',
    'thank_you_title' => 'Thanks for your input!',
    'thank_you'       => 'Your feedback will directly help shape the Rules to Protect identity and website.',

    'questions' => [

        [
            'type'  => 'group',
            'questions' => [
                [
                    'key'          => 'name',
                    'type'         => 'text',
                    'label'        => 'Your name?',
                    'placeholder'  => 'Jane Smith',
                    'autocomplete' => 'name',
                    'required'     => true,
                ],
                [
                    'key'      => 'email',
                    'type'     => 'email',
                    'label'    => 'Your email address?',
                    'required' => true,
                ],
                [
                    'key'         => 'role',
                    'type'        => 'text',
                    'label'       => 'Your organisation / coalition / role?',
                    'placeholder' => 'e.g. Friends of the Earth, Communications',
                    'required'    => true,
                ],
            ],
        ],

        [
            'key'         => 'involvement',
            'type'        => 'checkbox',
            'label'       => 'How are you likely to be involved in the campaign?',
            'description' => 'Select all that apply.',
            'required'    => false,
            'summary'     => true,
            'options'     => [
                'Core campaign / coordination',
                'Communications / social media',
                'Policy / advocacy',
                'National coalition or local campaign',
                'Website content / resources',
                'Activist mobilisation',
                'Other',
            ],
        ],

        // ── Campaign strategy ───────────────────────────────────────────
        [
            'key'         => 'campaign_purpose',
            'type'        => 'ranking',
            'label'       => 'What should the campaign primarily achieve?',
            'description' => 'Drag to rank. 1 is the highest priority.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Explain why deregulation matters',
                'Mobilise NGOs, civil society groups and activists',
                'Put public pressure on EU decision-makers',
                'Make the coalition feel credible and active',
                'Provide practical campaign tools and resources',
                'Counter the "competitiveness" narrative',
            ],
        ],

        [
            'key'         => 'primary_audience',
            'type'        => 'ranking',
            'label'       => 'Who is the most important audience for the campaign?',
            'description' => 'Drag to rank. 1 is the primary audience.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'NGOs and civil society groups who do not yet understand the issue fully',
                'Activists and campaigners',
                'National coalitions / country-level groups',
                'Persuadable decision-makers',
                'Journalists / media',
                'The wider public',
            ],
        ],

        [
            'key'      => 'key_message',
            'type'     => 'textarea',
            'label'    => 'What is the single most important message people should take away from the campaign?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'         => 'desired_feelings',
            'type'        => 'checkbox',
            'label'       => 'What should people feel after encountering the campaign?',
            'description' => 'Select up to 4.',
            'max'         => 4,
            'required'    => false,
            'summary'     => true,
            'options'     => [
                'Alarmed',
                'Angry',
                'Motivated',
                'Informed',
                'Hopeful',
                'Part of a movement',
                'Clear on what action to take',
                'More confident explaining the issue to others',
            ],
        ],

        // ── Tone and theme ──────────────────────────────────────────────
        [
            'key'         => 'tone',
            'type'        => 'ranking',
            'label'       => 'What tone should the campaign have?',
            'description' => 'Drag to rank. 1 is the strongest tone.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Funny / cheeky',
                'Bold and confrontational',
                'Clear and educational',
                'Hopeful and movement-building',
                'Angry / urgent',
                'Serious and credible',
            ],
        ],

        [
            'key'         => 'themes',
            'type'        => 'ranking',
            'label'       => 'Which campaign themes feel most useful?',
            'description' => 'Drag to rank. 1 is the most useful.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Rules protect people',
                'Deregulation as destruction / demolition',
                'Deregulation as corporations "cutting through" protections',
                'Rules as safety equipment / guardrails / seatbelts',
                'Environmental and social protections as things worth defending',
                'The EU "breaking its own promises"',
                'Big business interests versus people and planet',
                'A movement of people protecting what matters',
            ],
        ],

        [
            'key'      => 'avoid',
            'type'     => 'textarea',
            'label'    => 'Are there any tones, jokes, symbols or visual approaches we should avoid?',
            'required' => false,
            'summary'  => true,
        ],

        // ── Visual identity and campaign style ──────────────────────────
        [
            'key'         => 'visual_identity',
            'type'        => 'ranking',
            'label'       => 'What should the visual identity feel like?',
            'description' => 'Drag to rank. 1 is the most important quality.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Bold and colourful',
                'Grassroots / movement-led',
                'Playful and cheeky',
                'Clear and practical',
                'European / international',
                'Urgent and campaign-focused',
                'Friendly and accessible',
                'Credible enough for policy audiences',
            ],
        ],

        [
            'key'      => 'chainsaw_motif',
            'type'     => 'radio',
            'label'    => 'How important is the chainsaw motif to the campaign identity?',
            'required' => true,
            'summary'  => true,
            'options'  => [
                ['label' => 'Very important',          'description' => 'It should be central to the identity and considered for the logo or main campaign symbol.'],
                ['label' => 'Somewhat important',      'description' => 'It should appear in the campaign, but not necessarily as the main logo or long-term symbol.'],
                ['label' => 'Useful as a short-term hook', 'description' => 'It may work for launch activity or specific campaign moments, but should not define the whole identity.'],
                ['label' => 'Not essential',           'description' => 'The identity should work without it, though it could appear occasionally if useful.'],
                ['label' => 'Avoid it',                'description' => 'The campaign should move away from the chainsaw motif.'],
                'Not sure',
            ],
        ],

        [
            'key'      => 'other_symbols',
            'type'     => 'textarea',
            'label'    => 'If not a chainsaw, what other symbols or metaphors could represent the movement?',
            'required' => false,
            'summary'  => true,
        ],

        // ── Website strategy ────────────────────────────────────────────
        [
            'key'         => 'website_purpose',
            'type'        => 'ranking',
            'label'       => 'What should the website primarily do?',
            'description' => 'Drag to rank. 1 is the highest priority.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Explain the issue to people new to deregulation',
                'Present the coalition / movement and the groups involved',
                'Help people find national coalitions and local actions',
                'Host campaign resources and toolkits',
                'Show a timeline of deregulation and resistance',
                'Encourage signups / contact / involvement',
                'Support media, advocacy and campaign activity',
                'Provide a flexible home for the campaign over several years',
            ],
        ],

        [
            'key'         => 'website_sections',
            'type'        => 'ranking',
            'label'       => 'What website sections are most important?',
            'description' => 'Drag to rank. 1 is the most important section.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'About the campaign',
                'Why rules matter / issue explainer',
                'Groups involved',
                'National coalitions',
                'Resources',
                'Timeline',
                'Toolkit for activists',
                'Contact',
                'Sign up / get involved',
                'News / updates',
                'Social media links',
            ],
        ],



        // ── Final open questions ────────────────────────────────────────
        [
            'key'      => 'identity_must_get_right',
            'type'     => 'textarea',
            'label'    => 'What is one thing the campaign identity must get right?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'website_must_get_right',
            'type'     => 'textarea',
            'label'    => 'What is one thing the website must get right?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'references',
            'type'     => 'textarea',
            'label'    => 'Are there any existing campaigns, movements or websites that feel relevant — either as inspiration or as something to avoid?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'anything_else',
            'type'     => 'textarea',
            'label'    => 'Is there anything important we haven\'t asked that should shape the branding, campaign or website?',
            'required' => false,
            'summary'  => true,
        ],

    ],
];
