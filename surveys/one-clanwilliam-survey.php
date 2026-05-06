<?php

/**
 * One Clanwilliam Website Survey
 * URL: /?s=one-clanwilliam-survey
 */
return [
    'title'       => 'One Clanwilliam Website Survey',
    'description' => 'We\'re shaping the One Clanwilliam website and would value your input. Please answer honestly. Responses will be used to identify overall themes and won\'t be attributed to individuals.

This should take about 5–10 minutes. Thanks for your time.',
    'thank_you_title' => 'Thanks for your input!',
    'thank_you'       => 'Your feedback will directly help shape the direction of the One Clanwilliam website.',

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
            'key'         => 'website_purpose',
            'type'        => 'ranking',
            'label'       => 'What should the One Clanwilliam website primarily achieve?',
            'description' => 'Drag to rank. 1 is the highest priority.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Generate leasing interest',
                'Present the building as a landmark Dublin office development',
                'Support broker/agent conversations',
                'Communicate sustainability / net-zero credentials',
                'Provide key information for the general public',
                'Capture enquiries / contact details',
                'Support media or campaign activity',
            ],
        ],

        [
            'key'         => 'primary_audience',
            'type'        => 'ranking',
            'label'       => 'Who is the most important audience for the website?',
            'description' => 'Drag to rank. 1 is the primary audience.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Prospective commercial tenants',
                'Agents / brokers',
                'Existing Hibernia contacts',
                'Media / press',
                'Local public / neighbours',
                'Investors / corporate stakeholders',
                'Internal Hibernia / project team',
            ],
        ],

        [
            'key'      => 'key_message',
            'type'     => 'textarea',
            'label'    => 'What is the single most important message the website should communicate on first visit?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'type'              => 'group',
            'layout'            => 'two-col',
            'paired_exclusive'  => true,
            'description'       => 'The website is likely to be delivered in phases: an initial holding/splash page to support early campaign activity, followed by a fuller marketing website later. For the questions below, please indicate what you think needs to be included in the first launch, and what can wait until the full website.',
            'questions' => [
                [
                    'key'         => 'phase_1_must_include',
                    'type'        => 'checkbox',
                    'label'       => 'What must be included in the initial holding/splash page?',
                    'description' => 'Select all that apply.',
                    'required'    => false,
                    'summary'     => true,
                    'options'     => [
                        'Contact / leasing enquiry form',
                        'Leasing team contact details',
                        'Data capture / mailing list signup',
                        'Downloadable brochure / RFP PDF',
                        'Mobile-friendly online brochure / RFP page',
                        'Sustainability / net-zero summary',
                        'Availability / timeline information',
                        'Building specifications',
                        'Floor plans',
                        'Local amenities / neighbourhood information',
                        'None of the above / not sure',
                    ],
                ],
                [
                    'key'         => 'phase_2_can_wait',
                    'type'        => 'checkbox',
                    'label'       => 'What can wait until a later date and be included in the full website?',
                    'description' => 'Select all that apply.',
                    'required'    => false,
                    'summary'     => true,
                    'options'     => [
                        'Contact / leasing enquiry form',
                        'Leasing team contact details',
                        'Data capture / mailing list signup',
                        'Downloadable brochure / RFP PDF',
                        'Mobile-friendly online brochure / RFP page',
                        'Sustainability / net-zero summary',
                        'Availability / timeline information',
                        'Building specifications',
                        'Floor plans',
                        'Local amenities / neighbourhood information',
                        'None of the above / not sure',
                    ],
                ],
            ],
        ],

        [
            'key'      => 'immersive_importance',
            'type'     => 'radio',
            'label'    => 'How important is a more immersive, animated website experience for this project?',
            'required' => false,
            'summary'  => true,
            'options'  => [
                'Essential — the site should feel highly distinctive and premium',
                'Important — but only where it supports the content',
                'Nice to have — polish matters, but clarity is more important',
                'Low priority — a simpler brochure-style site is enough',
                'Not sure',
            ],
        ],

        [
            'key'         => 'critical_assets',
            'type'        => 'checkbox',
            'label'       => 'What content or assets are most critical to making the website successful?',
            'description' => 'Select up to 4.',
            'max'         => 4,
            'required'    => false,
            'summary'     => true,
            'options'     => [
                'Exterior renders',
                'Interior renders',
                'Video / motion assets',
                'Photography',
                'Floor plans',
                'Building specifications',
                'Sustainability credentials',
                'Location / transport information',
                'Amenity information',
                'Leasing / contact information',
                'Project narrative / copywriting',
                'Facts and figures',
            ],
        ],

        [
            'key'      => 'one_thing_well',
            'type'     => 'textarea',
            'label'    => 'If the first launch could only do one thing really well, what should it be?',
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
