<?php

/**
 * Rules to Protect — Visual Route Feedback
 * URL: /?s=rules-to-protect-feedback
 */
return [
    'title'       => 'Rules to Protect — Visual Route Feedback',
    'description' => 'Thanks for helping shape the Rules to Protect visual identity so far. We\'ve narrowed the direction down to four visual routes.

This short follow-up captures which route feels strongest, and any notes on how it could be developed further. Responses will be reviewed together — no answer will be attributed to an individual.

This should take about 3 minutes.',
    'thank_you_title' => 'Thanks for your input!',
    'thank_you'       => 'Your feedback will directly help us choose the strongest route to take forward.',

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
                    'key'         => 'role',
                    'type'        => 'text',
                    'label'       => 'Your organisation?',
                    'placeholder' => 'e.g. Friends of the Earth Europe',
                    'required'    => true,
                ],
            ],
        ],

        [
            'key'            => 'preferred_route',
            'type'           => 'ranking',
            'label'          => 'Rank the three visual routes for Rules to Protect.',
            'description'    => 'Drag to rank. 1 is your strongest preference. Or, if none feel right, tick the box below the list.',
            'required'       => true,
            'summary'        => true,
            'bailout_option' => 'None of the above',
            'items'          => [
                ['label' => 'Route 1', 'image' => 'media/route-1.png'],
                ['label' => 'Route 2', 'image' => 'media/route-2.png'],
                ['label' => 'Route 3', 'image' => 'media/route-3.png'],
            ],
        ],

        [
            'key'         => 'route_notes',
            'type'        => 'textarea',
            'label'       => 'Any notes on how your preferred route could be improved, why none of the routes worked for you, or any other feedback you\'d like to share?',
            'description' => 'Where you\'re talking about specific elements, please reference page numbers from the presentation.',
            'required'    => false,
            'summary'     => true,
        ],

    ],
];
