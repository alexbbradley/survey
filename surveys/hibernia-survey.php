<?php

/**
 * Hibernia Internal Staff Survey
 * URL: /?s=hibernia-survey
 */
return [
    'title'       => 'Hibernia Website Survey',
    'description' => 'We\'re reviewing the Hibernia website to understand how it should better support the business. Please answer honestly. Responses will be used to identify overall themes and won\'t be attributed to individuals.

The survey should take about 5 minutes. Thanks for your time.',
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
                    'key'         => 'department',
                    'type'        => 'text',
                    'label'       => 'Your department or role at Hibernia?',
                    'placeholder' => 'e.g. Asset Management, Development, Finance',
                    'required'    => true,
                ],
            ],
        ],

        [
            'key'      => 'send_frequency',
            'type'     => 'radio',
            'label'    => 'When do you send people to the website?',
            'required' => true,
            'summary'  => true,
            'options'  => [
                'Introducing Hibernia',
                'Showing a building',
                'ESG info',
                'Recruitment',
                'Rarely',
                'Never',
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
            'key'         => 'missing_info',
            'type'        => 'textarea',
            'label'       => 'What information do people ask you for that should already be on the website?',
            'required'    => false,
            'summary'     => true,
        ],

        [
            'key'         => 'useful_functionality',
            'type'        => 'textarea',
            'label'       => 'What functionality would make your work easier?',
            'description' => 'e.g. document hosting, recruitment tools, sales materials, client resources, etc.',
            'required'    => false,
            'summary'     => true,
        ],

        [
            'key'      => 'website_audience',
            'type'     => 'ranking',
            'label'    => 'Who do you think the website is mainly for?',
            'description' => 'Drag to reorder. 1 is the primary audience.',
            'required' => true,
            'summary'  => true,
            'items'    => [
                'Tenants',
                'Agents/brokers',
                'Investors',
                'Talent',
                'Media',
                'Public',
            ],
        ],

        [
            'key'      => 'reflects_quality',
            'type'     => 'radio',
            'label'    => 'Does the website reflect the quality of the portfolio?',
            'required' => true,
            'summary'  => true,
            'options'  => [
                'Yes',
                'Somewhat',
                'No',
            ],
        ],

        [
            'key'         => 'reflects_quality_why',
            'type'        => 'textarea',
            'label'       => 'Why?',
            'description' => 'What makes you feel that way about how the portfolio is represented?',
            'required'    => false,
            'summary'     => true,
        ],

        [
            'key'      => 'improve_areas',
            'type'     => 'ranking',
            'label'    => 'Rank what the website should prioritise',
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
            'key'         => 'change_one_thing',
            'type'        => 'textarea',
            'label'       => 'If you could change one thing about the website immediately, what would it be?',
            'required'    => false,
            'summary'     => true,
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
