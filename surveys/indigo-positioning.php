<?php

/**
 * Indigo Positioning Survey
 * URL: /?s=indigo-positioning
 */
return [
    'title'       => 'Indigo Website Survey',
    'description' => 'We\'re reviewing the Indigo website to understand how it should better support the business. Please answer honestly. Responses will be used to identify overall themes and won\'t be attributed to individuals.

The survey should take 5-10 minutes. Thank you for your time.',
    'thank_you'   => 'Your feedback will directly help shape the direction of the website.
    
    If you have anything else to add, please don\'t hesitate to contact <a class="underline hover:text-[#fffbf5]" href="mailto:chris.Findon@indigotg.com">chris.findon@indigotg.com</a>.',

    'questions' => [

        [
            'type'  => 'group',
            // 'label' => 'About You',
            'questions' => [
                [
                    'key'          => 'name',
                    'type'         => 'text',
                    'label'        => 'What\'s your name?',
                    'placeholder'  => 'Jane Smith',
                    'autocomplete' => 'name',
                    'required'     => true,
                ],
                [
                    'key'      => 'email',
                    'type'     => 'email',
                    'label'    => 'What\'s your email address?',
                    'required' => true,
                ],
                [
                    'key'         => 'role',
                    'type'        => 'text',
                    'label'       => 'What\'s your role at Indigo?',
                    'placeholder' => 'e.g. Director, Project Manager',
                    'required'    => true,
                ],
            ],
        ],

        [
            'key'      => 'market_position',
            'type'     => 'radio',
            'label'    => 'How should Indigo be positioned in the market?',
            'required' => true,
            'summary'  => true,
            'options'  => [
                ['label' => 'Engineering contractor', 'description' => 'Delivers defined engineering or deployment projects.'],
                ['label' => 'Operational delivery partner', 'description' => 'Trusted to deliver and manage infrastructure programmes.'],
                ['label' => 'Strategic infrastructure partner', 'description' => 'A long-term partner helping customers plan and run critical infrastructure.'],
                'Unsure',
            ],
        ],

        [
            'key'      => 'known_for',
            'type'     => 'textarea',
            'label'    => 'What should Indigo be known for, and how should the website reinforce this?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'         => 'ideal_customer',
            'type'        => 'textarea',
            'label'       => 'What does Indigo\'s ideal customer look like?',
            'description' => 'Industry, company size, type of organisation, typical decision maker.',
            'required'    => false,
            'summary'     => true,
        ],

        [
            'key'      => 'compared_with',
            'type'     => 'text',
            'label'    => 'Which companies should Indigo be compared with?',
            'required' => false,
            'summary'  => true,
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
            'key'      => 'website_influence',
            'type'     => 'radio',
            'label'    => 'At what stage should the website be most important?',
            'required' => true,
            'summary'  => true,
            'options'  => [
                ['label' => 'Early awareness', 'description' => 'Helping potential customers first understand Indigo and its capabilities.'],
                ['label' => 'Vendor evaluation', 'description' => 'Supporting comparison against other providers during selection.'],
                ['label' => 'Final credibility check', 'description' => 'Confirming trust, scale and experience before a decision is made.'],
                'Not sure',
            ],
        ],

        [
            'key'      => 'improve_areas',
            'type'     => 'ranking',
            'label'    => 'Rank what the website should prioritise most',
            'required' => true,
            'summary'  => true,
            'items'    => [
                'Explaining Indigo\'s services and capabilities',
                'Demonstrating Indigo\'s credibility and experience',
                'Supporting new business enquiries',
                'Supporting sales activity',
                'Recruitment and careers',
                'Client and internal resources',
                'News and insights',
                'Handling general enquiries',
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
