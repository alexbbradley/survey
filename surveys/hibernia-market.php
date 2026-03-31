<?php

/**
 * Hibernia External / Market Survey
 * URL: /?s=hibernia-market
 */
return [
    'title'       => 'Hibernia Website — External Feedback',
    'description' => 'We\'re refreshing the Hibernia website and would value your perspective as someone who knows our market or has worked with us.

Your answers will help us understand what matters most when evaluating property companies like Hibernia, and what the website needs to communicate.

All responses are confidential. This should take about 5 minutes.',
    'thank_you_title' => 'Thanks for your feedback!',
    'thank_you'       => 'Your perspective is really valuable and will help shape the new Hibernia website.',

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
                    'key'         => 'relationship',
                    'type'        => 'text',
                    'label'       => 'Your relationship to Hibernia?',
                    'placeholder' => 'e.g. Tenant, Agent, Broker, Investor, Adviser',
                    'required'    => true,
                ],
            ],
        ],

        [
            'key'      => 'evaluation_priorities',
            'type'     => 'ranking',
            'label'    => 'What matters when evaluating a commercial property owner or developer?',
            'description' => 'Drag to reorder. 1 is the most important.',
            'required' => true,
            'summary'  => true,
            'items'    => [
                'Building quality',
                'Location quality',
                'Sustainability credentials',
                'Track record',
                'Financial stability',
                'Reputation',
                'Tenant experience',
                'Design quality',
            ],
        ],

        [
            'key'      => 'look_for_first',
            'type'     => 'textarea',
            'label'    => 'What do you usually look for first on a property company\'s website?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'trust_signals',
            'type'     => 'textarea',
            'label'    => 'What information makes you trust a property company?',
            'description' => 'e.g. portfolio quality, tenants, certifications, delivery track record, financial backing, ESG metrics.',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'         => 'building_info',
            'type'        => 'textarea',
            'label'       => 'What information about a building do you expect to find easily?',
            'description' => 'e.g. availability, specs, sustainability, amenities, floorplates, location, transport.',
            'required'    => false,
            'summary'     => true,
        ],

        [
            'key'      => 'visit_stage',
            'type'     => 'radio',
            'label'    => 'At what stage do you typically visit a property company\'s website?',
            'required' => true,
            'summary'  => true,
            'options'  => [
                'Early research',
                'Shortlisting / comparison',
                'Final validation',
                'Rarely',
            ],
        ],

        [
            'key'      => 'what_makes_contact',
            'type'     => 'textarea',
            'label'    => 'What would make you contact a property company after visiting their website?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'what_stops_contact',
            'type'     => 'textarea',
            'label'    => 'What would stop you from getting in touch?',
            'required' => false,
            'summary'  => true,
        ],



        [
            'key'      => 'comparable_companies',
            'type'     => 'text',
            'label'    => 'Which other property companies do you associate with Hibernia?',
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
