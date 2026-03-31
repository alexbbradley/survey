<?php

/**
 * Hibernia Positioning Survey (Leadership)
 * URL: /?s=hibernia-positioning
 */
return [
    'title'       => 'Hibernia Website — Positioning Survey',
    'description' => 'This survey is about how Hibernia should be positioned and what the website needs to communicate. Your answers will help shape the messaging, tone, and focus of the new site.

This should take about 5 minutes. Thanks for your time.',
    'thank_you_title' => 'Thanks for your input!',
    'thank_you'       => 'Your perspective will directly shape how Hibernia is presented online.',

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
                    'placeholder' => 'e.g. CEO, Head of Asset Management',
                    'required'    => true,
                ],
            ],
        ],

        [
            'key'      => 'market_position',
            'type'     => 'radio',
            'label'    => 'How should Hibernia primarily be seen?',
            'required' => true,
            'summary'  => true,
            'options'  => [
                ['label' => 'Premium Dublin office owner', 'description' => 'Known for quality Grade A+ workspace in prime Dublin locations.'],
                ['label' => 'Long-term asset manager', 'description' => 'Focused on value creation and portfolio performance over time.'],
                ['label' => 'Sustainable developer', 'description' => 'Leading on LEED Platinum and ESG-driven development.'],
                ['label' => 'Urban regeneration specialist', 'description' => 'Transforming older buildings into modern, high-performance workspace.'],
                ['label' => 'Tenant-focused landlord', 'description' => 'Known for service, relationships, and occupier experience.'],
                'Not sure',
            ],
        ],

        [
            'key'         => 'works_well',
            'type'        => 'textarea',
            'label'       => 'What currently works well on the website?',
            'required'    => false,
            'summary'     => true,
        ],

        [
            'key'         => 'frustrations',
            'type'        => 'textarea',
            'label'       => 'What doesn\'t work well or causes frustration?',
            'required'    => false,
            'summary'     => true,
        ],

        [
            'key'      => 'key_message',
            'type'     => 'textarea',
            'label'    => 'What is the single most important message the website must communicate?',
            'required' => true,
            'summary'  => true,
        ],

        [
            'key'      => 'known_for',
            'type'     => 'textarea',
            'label'    => 'What should Hibernia be known for, and how should the website reinforce this?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'         => 'ideal_tenant',
            'type'        => 'textarea',
            'label'       => 'What does Hibernia\'s ideal tenant profile look like?',
            'description' => 'Industry, company size, stage of growth, typical decision maker.',
            'required'    => false,
            'summary'     => true,
        ],

        [
            'key'      => 'compared_with',
            'type'     => 'text',
            'label'    => 'Which property companies should Hibernia be compared with?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'website_role',
            'type'     => 'radio',
            'label'    => 'What role should the website play?',
            'required' => true,
            'summary'  => true,
            'options'  => [
                'Corporate credibility',
                'Portfolio showcase',
                'Leasing support',
                'Recruitment tool',
                'ESG communication',
                'Media reference',
            ],
        ],

        [
            'key'      => 'improve_areas',
            'type'     => 'ranking',
            'label'    => 'Rank what the website should prioritise most',
            'description' => 'Click and drag to reorder. 1 is the highest priority.',
            'required' => true,
            'summary'  => true,
            'items'    => [
                'Showcasing the property portfolio',
                'Demonstrating track record',
                'Sustainability leadership',
                'Explaining company strategy',
                'Leasing enquiries',
                'Recruitment',
                'News',
                'Corporate information',
            ],
        ],



        [
            'key'      => 'change_one_thing',
            'type'     => 'textarea',
            'label'    => 'If you could change one thing about the website immediately, what would it be?',
            'required' => false,
            'summary'  => true,
        ],
        [
            'key'      => 'anything_else',
            'type'     => 'textarea',
            'label'    => 'Is there anything important we haven\'t asked that you think we should consider?',
            'required' => false,
            'summary'  => true,
        ],

    ],
];
