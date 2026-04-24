<?php

/**
 * Hibernia Website Questionnaire
 * URL: /?s=hibernia-questionnaire
 */
return [
    'title'       => 'Hibernia Website Questionnaire',
    'description' => 'We\'re reviewing the Hibernia website to understand how it should better support the business. Please answer honestly. Responses will be used to identify overall themes and won\'t be attributed to individuals.

This should take about 10–15 minutes. Thanks for your time.',
    'thank_you_title' => 'Thanks for your input!',
    'thank_you'       => 'Your feedback will directly help shape the direction of the website.',

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
                    'label'       => 'Your role at Hibernia?',
                    'placeholder' => 'e.g. Asset Management, Development, Finance',
                    'required'    => true,
                ],
            ],
        ],

        [
            'key'         => 'market_position',
            'type'        => 'checkbox',
            'label'       => 'How should Hibernia primarily be seen in the market?',
            'description' => 'Select up to 2.',
            'max'         => 2,
            'required'    => true,
            'summary'     => true,
            'options'     => [
                ['label' => 'Premium Dublin office developer/landlord', 'description' => 'Known for quality Grade A+ workspace in prime Dublin locations.'],
                ['label' => 'Long-term asset manager', 'description' => 'Focused on value creation and portfolio performance over time.'],
                ['label' => 'Sustainable developer/landlord', 'description' => 'Leading on best in class ESG-driven development and asset management.'],
                ['label' => 'Urban regeneration specialist', 'description' => 'Transforming older buildings into modern high-performance workplaces.'],
                ['label' => 'Tenant-focused landlord', 'description' => 'Known for service, relationships and occupier experience.'],
                'Not sure',
            ],
        ],

        [
            'key'      => 'purpose',
            'type'     => 'textarea',
            'label'    => 'What do you believe Hibernia\'s purpose is beyond financial performance?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'         => 'daily_influences',
            'type'        => 'checkbox',
            'label'       => 'In your experience, what most influences decisions in Hibernia day-to-day?',
            'description' => 'Select up to 3.',
            'max'         => 3,
            'required'    => false,
            'summary'     => true,
            'options'     => [
                'Financial returns',
                'Customer/tenant needs',
                'Long-term value creation',
                'Risk management',
                'Reputation/brand',
                'Sustainability/ESG',
                'Leadership direction',
            ],
        ],

        [
            'key'      => 'daily_influences_other',
            'type'     => 'text',
            'label'    => 'Anything else that influences day-to-day decisions?',
            'placeholder' => 'Optional',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'key_message',
            'type'     => 'textarea',
            'label'    => 'What is the single most important message the website must communicate on first visit?',
            'required' => true,
            'summary'  => true,
        ],

        [
            'key'         => 'differentiators',
            'type'        => 'checkbox',
            'label'       => 'What sets Hibernia apart from its competitors?',
            'description' => 'Select up to 3.',
            'max'         => 3,
            'required'    => false,
            'summary'     => true,
            'options'     => [
                'Quality of assets',
                'Location strategy',
                'Tenant relationships',
                'Sustainability leadership',
                'Track record',
                'Team / expertise',
                'Brand / reputation',
            ],
        ],

        [
            'key'         => 'differentiators_other',
            'type'        => 'text',
            'label'       => 'Anything else that sets Hibernia apart?',
            'placeholder' => 'Optional',
            'required'    => false,
            'summary'     => true,
        ],

        [
            'key'      => 'competitors',
            'type'     => 'textarea',
            'label'    => 'Who do you see as Hibernia\'s main competitors?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'         => 'website_audience',
            'type'        => 'ranking',
            'label'       => 'Who should the website primarily serve?',
            'description' => 'Drag to rank. 1 is the primary audience.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Tenants',
                'Investors',
                'Agents/brokers',
                'Talent',
                'Media',
                'Public',
            ],
        ],

        [
            'key'      => 'primary_role',
            'type'     => 'radio',
            'label'    => 'What should be the website\'s primary role above all others?',
            'required' => true,
            'summary'  => true,
            'options'  => [
                'Portfolio showcase',
                'Leasing support',
                'Corporate credibility',
                'Recruitment',
                'ESG communication',
                'Media reference',
            ],
        ],

        [
            'key'         => 'improve_areas',
            'type'        => 'ranking',
            'label'       => 'Rank what messaging the website should prioritise',
            'description' => 'Drag to rank. 1 is the highest priority.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Demonstrating track record',
                'Explaining company strategy',
                'Showcasing the property portfolio',
                'Sustainability leadership',
                'Community and tenant experience',
                'News and thought leadership',
                'Recruitment',
                'Leasing enquiries',
                'Corporate information',
            ],
        ],

        [
            'key'         => 'send_frequency',
            'type'        => 'checkbox',
            'label'       => 'When do you typically direct people to the website?',
            'description' => 'Select all that apply.',
            'required'    => false,
            'summary'     => true,
            'options'     => [
                'Introducing Hibernia',
                'Showcasing a building',
                'Supporting leasing conversations',
                'ESG information',
                'Recruitment',
                'Rarely / never',
            ],
        ],

        [
            'key'      => 'works_well',
            'type'     => 'textarea',
            'label'    => 'What currently works well on the website?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'frustrations',
            'type'     => 'textarea',
            'label'    => 'What doesn\'t work well or causes frustration?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'missing_info',
            'type'     => 'textarea',
            'label'    => 'What information do people ask you for that should already be on the website?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'reflects_portfolio',
            'type'     => 'textarea',
            'label'    => 'Does the website accurately reflect the quality of Hibernia\'s portfolio? Why or why not?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'change_one_thing',
            'type'     => 'textarea',
            'label'    => 'If you could change one thing about the website immediately, what would it be?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'reflects_culture',
            'type'     => 'textarea',
            'label'    => 'Does the website accurately reflect the culture of Hibernia and its employees? Why or why not?',
            'required' => false,
            'summary'  => true,
        ],

    ],
];
