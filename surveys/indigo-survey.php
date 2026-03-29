<?php

/**
 * Indigo Website Refresh Survey
 * URL: /?s=indigo-survey
 */
return [
    'title'       => 'Indigo Website Survey',
    'description' => 'We\'re reviewing the Indigo website to understand what it needs to do better for the business and for the teams that use it.

Your input is valuable because you see how the company operates day-to-day. Please answer honestly — there are no right or wrong answers.

Responses will be reviewed as part of the overall findings and won\'t be attributed to individuals in any reporting. The goal is to identify patterns and priorities, not individual views.

This should take about 5 minutes.',
    'thank_you_title' => 'Thanks for your input!',
    'thank_you'       => 'Your feedback will directly help shape the direction of the website.

If you think of anything else later, feel free to send it on.',

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
                    'key'         => 'department',
                    'type'        => 'text',
                    'label'       => 'What department are you in?',
                    'placeholder' => 'e.g. Marketing, Engineering',
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
            'description' => 'e.g. document hosting, recruitment tools, sales materials, client resources',
            'required'    => false,
            'summary'     => true,
        ],

        [
            'key'      => 'improve_areas',
            'type'     => 'ranking',
            'label'    => 'Rank which areas the website should improve most',
            'required' => true,
            'summary'  => true,
            'items'    => [
                'Explaining what Indigo does',
                'Demonstrating credibility',
                'Supporting sales conversations',
                'Recruitment and careers',
                'Internal or client resources',
                'News/insights',
                'Handling enquiries',
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
            'label'       => 'Anything else we should consider?',
            'required'    => false,
            'summary'     => true,
        ],

    ],
];
