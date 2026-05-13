<?php

/**
 * HONOR Website Questionnaire
 * URL: /?s=honor
 */
return [
    'title'       => 'HONOR Website Questionnaire',
    'description' => 'We\'re reviewing the HONOR website to understand how it should better support the brand, the bridal appointment journey, and the wider business.

Responses will be used to identify overall themes and won\'t be attributed to individuals.

This should take about 5 minutes.',
    'thank_you_title' => 'Thanks for your input!',
    'thank_you'       => 'Your feedback will directly help shape the direction of the HONOR website.',

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
                    'label'       => 'Your role at HONOR?',
                    'placeholder' => 'e.g. Design, Atelier, Operations',
                    'required'    => true,
                ],
            ],
        ],

        [
            'key'         => 'website_purpose',
            'type'        => 'ranking',
            'label'       => 'What should the website primarily do for HONOR?',
            'description' => 'Drag to rank. 1 is the highest priority.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Encourage qualified bridal appointment requests',
                'Build brand awareness and desire',
                'Showcase the collections and archive',
                'Explain the bespoke / made-to-measure process',
                'Sell products online',
                'Support press, stylists and stockists',
            ],
        ],

        [
            'key'         => 'website_audience',
            'type'        => 'ranking',
            'label'       => 'Who should the website primarily serve?',
            'description' => 'Drag to rank. 1 is the primary audience.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Brides ready to book an appointment',
                'Brides researching designers',
                'Press, stylists and industry partners',
                'Stockists / retail partners',
                'Existing customers',
            ],
        ],

        [
            'key'         => 'brand_positioning',
            'type'        => 'checkbox',
            'label'       => 'How should HONOR primarily be positioned?',
            'description' => 'Select up to 2.',
            'max'         => 2,
            'required'    => true,
            'summary'     => true,
            'options'     => [
                'Luxury bridal atelier',
                'Couture-level craftsmanship',
                'Modern romantic bridal brand',
                'New York-made fashion house',
                'Bespoke womenswear house',
            ],
        ],

        [
            'key'         => 'bride_understanding',
            'type'        => 'checkbox',
            'label'       => 'What does a bride need to understand before requesting an appointment?',
            'description' => 'Select up to 3.',
            'max'         => 3,
            'required'    => true,
            'summary'     => true,
            'options'     => [
                'The style and aesthetic of the gowns',
                'The price / investment level',
                'The bespoke or made-to-measure process',
                'Appointment format and what to expect',
                'Production timelines',
                'Whether HONOR is the right fit for her',
            ],
        ],

        [
            'key'      => 'key_improvement',
            'type'     => 'textarea',
            'label'    => 'What is the single most important improvement the new website should make?',
            'required' => true,
            'summary'  => true,
        ],

        [
            'key'      => 'anything_else',
            'type'     => 'textarea',
            'label'    => 'Is there anything important we haven\'t asked that should be considered?',
            'required' => false,
            'summary'  => true,
        ],

    ],
];
