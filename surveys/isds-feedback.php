<?php

/**
 * ISDS Campaign Identity — Visual Feedback
 * URL: /?s=isds-feedback
 */
return [
    'title'       => 'ISDS Project Symbol',
    'description' => 'Thanks for helping shape the new symbol around Investor-State Dispute Settlement (ISDS).

We\'ve developed six options for the symbol. This short follow-up captures which ones feel strongest, and any notes on how they could be developed further. Responses will be reviewed together. No answer will be attributed to an individual.

[View the six options in Figma](https://www.figma.com/proto/Bm8modcMHrZLC9crBgCXCJ/ISDS?node-id=71-3&p=f&viewport=504%2C-5450%2C0.13&t=om7hVMUqNaj6tSrp-1&scaling=contain&content-scaling=fixed&page-id=71%3A2) before ranking below.

This should take about 5 minutes.',
    'thank_you_title' => 'Thanks for your input!',
    'thank_you'       => 'Your feedback will directly help us choose the strongest direction to take forward.',

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
            'key'            => 'preferred_version',
            'type'           => 'ranking',
            'label'          => 'Rank the six visual directions for the ISDS campaign identity.',
            'description'    => 'Drag to rank. 1 is your strongest preference. Or, if none feel right, tick the box below the list.',
            'required'       => true,
            'summary'        => true,
            'bailout_option' => 'None of the above',
            'items'          => [
                ['label' => 'Free as a bird', 'image' => 'media/isds/isds-1.png'],
                ['label' => 'Rip/Tear', 'image' => 'media/isds/isds-2.png'],
                ['label' => 'Turn the page', 'image' => 'media/isds/isds-3.png'],
                ['label' => 'Arrows', 'image' => 'media/isds/isds-4.png'],
                ['label' => 'Character', 'image' => 'media/isds/isds-5.png'],
                ['label' => 'Free from the knot', 'image' => 'media/isds/isds-6.png'],
            ],
        ],

        [
            'key'         => 'version_notes',
            'type'        => 'textarea',
            'label'       => 'Tell us more about your choices.',
            'description' => 'What did you like about the version you preferred most? What didn\'t work about the one you liked least? Any ways you\'d improve them, or anything else you\'d like to share.',
            'required'    => false,
            'summary'     => true,
        ],

    ],
];
