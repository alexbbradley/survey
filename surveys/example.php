<?php

/**
 * Example survey definition.
 * Filename (without .php) = URL slug: /?s=example
 *
 * Supported question types:
 *   text      — single-line text input
 *   textarea  — multi-line text input
 *   email     — email address (validated)
 *   url       — URL (validated)
 *   radio     — single choice from a list of options
 *   ranking   — drag-to-reorder prioritisation; stored as JSON array
 *
 * Per-question keys:
 *   key         (string, required)  — unique snake_case identifier, stored in DB
 *   type        (string, required)  — one of the types above
 *   label       (string, required)  — the question text shown to the respondent
 *   required    (bool,   optional)  — default false
 *   placeholder (string, optional)  — hint text inside text/textarea/email/url inputs
 *   options     (array,  required for radio)  — list of choice strings
 *   items       (array,  required for ranking) — list of items to rank (default order)
 */
return [
    'title'       => 'Client Onboarding Survey',
    'description' => 'Just a few quick questions to help us get started.',
    'thank_you'   => 'All done — we\'ll be in touch within 24 hours.',

    'questions' => [

        [
            'key'         => 'name',
            'type'        => 'text',
            'label'       => 'What\'s your name?',
            'placeholder' => 'Jane Smith',
            'required'    => true,
        ],

        [
            'key'      => 'email',
            'type'     => 'email',
            'label'    => 'What\'s your email address?',
            'required' => true,
        ],

        [
            'key'         => 'website',
            'type'        => 'url',
            'label'       => 'Your website (if you have one)',
            'placeholder' => 'https://example.com',
            'required'    => false,
        ],

        [
            'key'         => 'about',
            'type'        => 'textarea',
            'label'       => 'Tell us a bit about your project',
            'placeholder' => 'What are you trying to build or achieve?',
            'required'    => true,
        ],

        [
            'key'      => 'budget',
            'type'     => 'radio',
            'label'    => 'What\'s your rough budget range?',
            'required' => true,
            'options'  => [
                'Under £5,000',
                '£5,000 – £15,000',
                '£15,000 – £50,000',
                '£50,000+',
                'Not sure yet',
            ],
        ],

        [
            'key'      => 'timeline',
            'type'     => 'radio',
            'label'    => 'When are you hoping to launch?',
            'required' => false,
            'options'  => [
                'As soon as possible',
                'Within 3 months',
                '3–6 months',
                '6+ months',
                'No fixed deadline',
            ],
        ],

        [
            'key'      => 'priorities',
            'type'     => 'ranking',
            'label'    => 'Drag to rank what matters most to you',
            'required' => false,
            'items'    => [
                'Speed of delivery',
                'Visual quality / design',
                'Budget / value',
                'Ongoing support',
                'Technical robustness',
            ],
        ],

        [
            'key'         => 'anything_else',
            'type'        => 'textarea',
            'label'       => 'Anything else you\'d like us to know?',
            'placeholder' => 'Optional — feel free to skip',
            'required'    => false,
        ],

    ],
];
