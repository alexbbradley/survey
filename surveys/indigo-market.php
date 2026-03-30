<?php

/**
 * Indigo External Survey (Clients / Advisory Board)
 * URL: /?s=indigo-external
 */
return [
    'title'       => 'Indigo Website Survey',
    'description' => 'We\'re reviewing the Indigo website to understand how it should better support the business. Please answer honestly. Responses will be used to identify overall themes and won\'t be attributed to individuals.

The survey should take about 5 minutes. Thank you for your time.',
    'thank_you'   => 'Your feedback will directly help shape the direction of the website.
    
    If you have anything else to add, please don\'t hesitate to contact <a class="underline hover:text-[#fffbf5]" href="mailto:chris.Findon@indigotg.com">chris.findon@indigotg.com</a>.',

    'questions' => [

        [
            'type'  => 'group',
            'label' => '',
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
                    'label'       => 'What\'s your relationship to Indigo?',
                    'placeholder' => 'e.g. Client, Board Member, Supplier, etc',
                    'required'    => true,
                ],
            ],
        ],

        [
            'key'      => 'evaluation_priorities',
            'type'     => 'ranking',
            'label'    => 'When evaluating companies like Indigo, what matters most?',
            'required' => false,
            'summary'  => true,
            'items'    => [
                'Proven track record and relevant experience',
                'Reliability and ability to deliver',
                'Scale and geographic coverage',
                'Technical expertise and specialist capability',
                'Reputation and brand credibility',
                'Certifications and compliance standards',
                'Cost competitiveness',
            ],
        ],

        [
            'key'      => 'look_for_first',
            'type'     => 'textarea',
            'label'    => 'What do you usually look for first on a company website like this?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'trust_signals',
            'type'     => 'textarea',
            'label'    => 'What information makes you trust an infrastructure provider?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'visit_stage',
            'type'     => 'radio',
            'label'    => 'At what stage do you typically visit a supplier\'s website?',
            'required' => true,
            'summary'  => true,
            'options'  => [
                'Early research',
                'Vendor comparison',
                'Final validation',
                'Rarely',
            ],
        ],

        [
            'key'      => 'what_makes_contact',
            'type'     => 'textarea',
            'label'    => 'What would make you contact a company after visiting their website?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'what_stops_contact',
            'type'     => 'textarea',
            'label'    => 'What would stop you from contacting a company?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'comparable_companies',
            'type'     => 'textarea',
            'label'    => 'When you think of Indigo, what other companies come to mind?',
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
