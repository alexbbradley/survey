<?php

/**
 * ISDS Campaign Identity Questionnaire
 * URL: /?s=isds-campaign-identity
 */
return [
    'title'       => 'ISDS Campaign Identity Questionnaire',
    'description' => 'Friends of the Earth Europe is developing a new campaign identity around Investor-State Dispute Settlement (ISDS), with the aim of encouraging countries to withdraw from the ISDS mechanism and building greater public awareness, visibility and engagement around the issue.

This short survey will help clarify the campaign\'s name, audience, message, tone and visual direction. Responses will be used to identify overall themes and will not be attributed to individuals.

This should take less than 10 minutes.',
    'thank_you_title' => 'Thanks for your input!',
    'thank_you'       => 'Your feedback will help shape the campaign name, identity and visual direction.',

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
                    'label'       => 'Your organisation / role / relationship to the campaign?',
                    'placeholder' => 'e.g. Friends of the Earth Europe — Trade Campaigner',
                    'required'    => true,
                ],
            ],
        ],

        [
            'key'         => 'involvement',
            'type'        => 'checkbox',
            'label'       => 'How are you likely to be involved in the campaign?',
            'description' => 'Select all that apply.',
            'required'    => false,
            'summary'     => true,
            'options'     => [
                'Core campaign / coordination',
                'Communications / social media',
                'Policy / advocacy',
                'National campaigning',
                'Coalition / ally organisation',
                'Activist mobilisation',
                'Other',
            ],
        ],

        [
            'key'      => 'campaign_name',
            'type'     => 'radio',
            'label'    => 'Which campaign name feels strongest?',
            'required' => true,
            'summary'  => true,
            'options'  => [
                'Beyond ISDS',
                'ISDS-Free',
                'Exit ISDS',
                'Laws not lawsuits',
                'Unchain Democracy',
                'Defend Sovereignty',
                'Billion-dollar Bullying',
                'Not sure / none of these feel right',
            ],
        ],

        [
            'key'         => 'name_suggestion',
            'type'        => 'text',
            'label'       => 'Do you have another name suggestion?',
            'placeholder' => 'Optional',
            'required'    => false,
            'summary'     => true,
        ],

        [
            'key'         => 'primary_audience',
            'type'        => 'ranking',
            'label'       => 'Who is the most important audience for the campaign identity to speak to?',
            'description' => 'Drag to rank. 1 is the highest priority.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Policy/governmental audiences already familiar with ISDS',
                'NGOs and civil society organisations',
                'Activists and campaigners',
                'National-level campaign groups',
                'Journalists / media',
                'The wider public',
            ],
        ],

        [
            'key'         => 'campaign_purpose',
            'type'        => 'ranking',
            'label'       => 'What should the campaign identity primarily help achieve?',
            'description' => 'Drag to rank. 1 is the highest priority.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Encourage countries to withdraw from ISDS',
                'Make ISDS feel more visible and publicly understandable',
                'Build credibility with policy and governmental audiences',
                'Mobilise activists and civil society groups',
                'Create a stronger sense of shared campaign identity across countries and allies',
                'Support clear, accessible public-facing communications',
            ],
        ],

        [
            'key'      => 'key_message',
            'type'     => 'textarea',
            'label'    => 'What is the single most important message people should take away from the campaign?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'         => 'tone',
            'type'        => 'ranking',
            'label'       => 'What tone should the campaign identity have?',
            'description' => 'Drag to rank. 1 is the strongest tone.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Serious and credible',
                'Clear and educational',
                'Bold and campaign-focused',
                'Urgent',
                'Hopeful / movement-building',
                'Accessible to non-specialist audiences',
                'Confrontational',
                'Playful / memorable',
            ],
        ],

        [
            'key'         => 'visual_identity',
            'type'        => 'ranking',
            'label'       => 'What should the visual identity feel like?',
            'description' => 'Drag to rank. 1 is the most important quality.',
            'required'    => true,
            'summary'     => true,
            'items'       => [
                'Credible enough for policy reports and advocacy materials',
                'Strong enough for banners, stickers and T-shirts',
                'Clear and accessible to people unfamiliar with ISDS',
                'European / international',
                'Grassroots / movement-led',
                'Bold and distinctive',
                'Flexible across formal and public-facing applications',
            ],
        ],

        [
            'key'      => 'avoid',
            'type'     => 'textarea',
            'label'    => 'Are there any tones, symbols, campaign styles or visual approaches we should avoid?',
            'required' => false,
            'summary'  => true,
        ],

        [
            'key'      => 'references',
            'type'     => 'textarea',
            'label'    => 'Are there any existing campaigns, movements or visual identities that feel relevant — either as inspiration or as something to avoid?',
            'required' => false,
            'summary'  => true,
        ],

    ],
];
