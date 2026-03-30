<?php

/**
 * Indigo Website Refresh Survey
 * URL: /?s=indigo-survey
 */
return [
    'title'       => 'Indigo Website Survey',
    'description' => 'We’re reviewing the Indigo website to understand how it should better support the business. Please answer honestly. Responses will be used to identify overall themes and won’t be attributed to individuals.

The survey should take about 5 minutes.Thanks for your time.',
    'thank_you_title' => 'Thanks for your input!',
    'thank_you'       => 'Your feedback will directly help shape the direction of the website.
    
    If you have anything else to add, please don\'t hesitate to contact <a class="underline hover:text-[#fffbf5]" href="mailto:chris.Findon@indigotg.com">chris.findon@indigotg.com</a>.',

    'questions' => [

        [
            'type'  => 'group',
            // 'label' => 'About You',
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
                    'label'       => 'Your department or role at Indigo?',
                    'placeholder' => 'e.g. Operations Manager, Sales, IT, etc',
                    'required'    => true,
                ],
            ],
        ],

        [
            'key'         => 'current_use',
            'type'        => 'textarea',
            'label'       => 'Do you currently use the website in your work? If yes, how?',
            'placeholder' => 'e.g. sharing with clients, checking case studies',
            'required'    => false,
            'summary'     => true,
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
            'key'      => 'improve_areas',
            'type'     => 'ranking',
            'label'    => 'What should the new website prioritise most?',
            'description' => 'Click and drag to reorder the list. 1 is the highest priority.',
            'required' => true,
            'summary'  => true,
            'items'    => [
                'Explaining Indigo’s services and capabilities',
                'Demonstrating Indigo’s credibility and experience',
                'Supporting new business enquiries',
                'Supporting sales activity',
                'Recruitment and careers',
                'Client and internal resources',
                'News and insights',
                'Handling general enquiries',
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
            'key'         => 'anything_else',
            'type'        => 'textarea',
            'label'       => 'Is there anything not considered in this survey that you would like to share?',
            'required'    => false,
            'summary'     => true,
        ],

    ],
];
