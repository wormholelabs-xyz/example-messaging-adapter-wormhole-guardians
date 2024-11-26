/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/endpoint.json`.
 */
export type Endpoint = {
  address: "FMPF1RnXz1vvZ6eovoEQqMPXYRUgYqFKFMXzTJkbWWVD";
  metadata: {
    name: "endpoint";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  docs: ["The main program module for the Endpoint"];
  instructions: [
    {
      name: "addAdapter";
      docs: [
        "Registers a new adapter for an integrator",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
        "* `args` - The `EnableAdapterArgs` struct containing:",
        "* `integrator_program` - The program id of the integrator_program",
        "* `adapter_program_id` - The address of the adapter to register",
      ];
      discriminator: [12, 127, 129, 184, 104, 145, 89, 169];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "admin";
          docs: ["The admin registered on IntegratorConfig"];
          signer: true;
        },
        {
          name: "integratorConfig";
          docs: [
            "The integrator config account",
            "This makes sure that the admin signing this ix is the one registered in the IntegratorConfig",
            "The new registered adapter will be pushed to the `adapter_infos` field in",
            "this account",
            "`has_one` constraint checks if admin signer is the current admin of the config",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
            ];
          };
        },
        {
          name: "adapterInfo";
          docs: [
            "The account to store information about the registered adapter",
            "The `init` constraint checks that the adapter has not been added. If it is,",
            "`AccountAlreadyInUse` error will be thrown",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  105,
                  110,
                  102,
                  111,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.adapter_program_id";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          docs: ["The system program"];
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "addAdapterArgs";
            };
          };
        },
      ];
    },
    {
      name: "attestMessage";
      docs: [
        "Attests to a message",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
        "* `args` - The `AttestMessageArgs` struct containing:",
        "* `adapter_program_id` - The program ID of the adapter",
        "* `adapter_pda_bump` - The bump for the adapter PDA",
        "* `src_chain` - The source chain ID",
        "* `src_addr` - The source address",
        "* `sequence` - The sequence number",
        "* `dst_chain` - The destination chain ID",
        "* `integrator_program_id` - The program ID of the integrator, aka dst_addr",
        "* `payload_hash` - The hash of the message payload",
      ];
      discriminator: [73, 216, 120, 205, 187, 68, 121, 94];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "adapterInfo";
          docs: ["The adapter info account"];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  105,
                  110,
                  102,
                  111,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.adapter_program_id";
              },
            ];
          };
        },
        {
          name: "adapterPda";
          docs: [
            "The adapter PDA signing account.",
            "This check makes sure that only the adapter program is authorised to call this message",
          ];
          signer: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [97, 100, 97, 112, 116, 101, 114, 95, 112, 100, 97];
              },
            ];
          };
        },
        {
          name: "integratorChainConfig";
          docs: ["The integrator chain config account"];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  104,
                  97,
                  105,
                  110,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.src_chain";
              },
            ];
          };
        },
        {
          name: "attestationInfo";
          docs: ["The attestation info account"];
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "attestMessageArgs";
            };
          };
        },
      ];
    },
    {
      name: "claimAdmin";
      docs: [
        "Claims the admin rights for an IntegratorConfig account",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
      ];
      discriminator: [148, 173, 240, 143, 219, 57, 241, 136];
      accounts: [
        {
          name: "newAdmin";
          docs: ["The signer, which must be the pending_admin"];
          signer: true;
        },
        {
          name: "integratorConfig";
          docs: [
            "The IntegratorConfig account being claimed",
            "The constraint here checks that there is a pending admin transfer and the signer is the pending_admin",
          ];
          writable: true;
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [];
    },
    {
      name: "disableRecvAdapter";
      docs: [
        "Disables a receive adapter for a specific chain",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
        "* `args` - The `DisableAdapterArgs` struct containing:",
        "* `chain_id` - The ID of the chain for which the adapter is being disabled",
        "* `adapter` - The Pubkey of the adapter to be disabled",
        "* `integrator_program` - The Pubkey of the integrator program",
      ];
      discriminator: [227, 120, 200, 101, 6, 20, 20, 237];
      accounts: [
        {
          name: "admin";
          docs: [
            "The admin account that has the authority to disable adapters",
          ];
          signer: true;
        },
        {
          name: "integratorConfig";
          docs: [
            "The integrator config account",
            "The account constraints here make sure that the one signing this transaction is the admin",
            "of the config",
          ];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
            ];
          };
        },
        {
          name: "integratorChainConfig";
          docs: [
            "The integrator chain config account",
            "The bitmap of in this chain config account will be updated",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  104,
                  97,
                  105,
                  110,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.chain_id";
              },
            ];
          };
        },
        {
          name: "adapterInfo";
          docs: [
            "The registered adapter account",
            "This makes sure that that the adapter is registered. Else, it will throw",
            "`AccountNotInitialized`",
          ];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  105,
                  110,
                  102,
                  111,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.adapter_program_id";
              },
            ];
          };
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "adapterInfoArgs";
            };
          };
        },
      ];
    },
    {
      name: "disableSendAdapter";
      docs: [
        "Disables a send adapter for a specific chain",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
        "* `args` - The `DisableAdapterArgs` struct containing:",
        "* `chain_id` - The ID of the chain for which the adapter is being disabled",
        "* `adapter` - The Pubkey of the adapter to be disabled",
        "* `integrator_program` - The Pubkey of the integrator program",
      ];
      discriminator: [206, 20, 131, 29, 146, 155, 166, 233];
      accounts: [
        {
          name: "admin";
          docs: [
            "The admin account that has the authority to disable adapters",
          ];
          signer: true;
        },
        {
          name: "integratorConfig";
          docs: [
            "The integrator config account",
            "The account constraints here make sure that the one signing this transaction is the admin",
            "of the config",
          ];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
            ];
          };
        },
        {
          name: "integratorChainConfig";
          docs: [
            "The integrator chain config account",
            "The bitmap of in this chain config account will be updated",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  104,
                  97,
                  105,
                  110,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.chain_id";
              },
            ];
          };
        },
        {
          name: "adapterInfo";
          docs: [
            "The registered adapter account",
            "This makes sure that that the adapter is registered. Else, it will throw",
            "`AccountNotInitialized`",
          ];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  105,
                  110,
                  102,
                  111,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.adapter_program_id";
              },
            ];
          };
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "adapterInfoArgs";
            };
          };
        },
      ];
    },
    {
      name: "discardAdmin";
      docs: [
        "Discards the admin role for an IntegratorConfig account, making it immutable",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
      ];
      discriminator: [185, 39, 136, 174, 168, 32, 162, 204];
      accounts: [
        {
          name: "admin";
          docs: ["The current admin of the IntegratorConfig account"];
          signer: true;
        },
        {
          name: "integratorConfig";
          docs: ["The IntegratorConfig account being modified"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "account";
                path: "integrator_config.integrator_program_id";
                account: "integratorConfig";
              },
            ];
          };
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [];
    },
    {
      name: "enableRecvAdapter";
      docs: [
        "Sets an adapter as a receive adapter for a specific chain",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
        "* `args` - The `EnableAdapterArgs` struct containing:",
        "* `chain_id` - The ID of the chain for which the adapter is being set",
        "* `adapter` - The Pubkey of the adapter to be set",
        "* `integrator_program` - The Pubkey of the integrator program",
      ];
      discriminator: [42, 197, 240, 186, 19, 125, 233, 113];
      accounts: [
        {
          name: "payer";
          docs: ["The account that pays for the transaction"];
          writable: true;
          signer: true;
        },
        {
          name: "admin";
          docs: ["The admin account that has the authority to set adapters"];
          signer: true;
        },
        {
          name: "integratorConfig";
          docs: [
            "The integrator config account",
            "The account constraints here make sure that the one signing this transaction is the admin",
            "of the config",
            "The `has_one` constraint checks if admin signer is the current admin of the config",
          ];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
            ];
          };
        },
        {
          name: "integratorChainConfig";
          docs: [
            "The integrator chain config account",
            "This account will be initialized if it doesn't exist, and its bitmap will be updated",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  104,
                  97,
                  105,
                  110,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.chain_id";
              },
            ];
          };
        },
        {
          name: "adapterInfo";
          docs: [
            "The registered adapter account",
            "This makes sure that the adapter is registered. Else, it will throw",
            "`AccountNotInitialized`",
          ];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  105,
                  110,
                  102,
                  111,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.adapter_program_id";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          docs: ["The System Program"];
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "adapterInfoArgs";
            };
          };
        },
      ];
    },
    {
      name: "enableSendAdapter";
      docs: [
        "Sets an adapter as a send adapter for a specific chain",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
        "* `args` - The `EnableAdapterArgs` struct containing:",
        "* `chain_id` - The ID of the chain for which the adapter is being set",
        "* `adapter` - The Pubkey of the adapter to be set",
        "* `integrator_program` - The Pubkey of the integrator program",
      ];
      discriminator: [198, 217, 176, 44, 168, 255, 169, 161];
      accounts: [
        {
          name: "payer";
          docs: ["The account that pays for the transaction"];
          writable: true;
          signer: true;
        },
        {
          name: "admin";
          docs: ["The admin account that has the authority to set adapters"];
          signer: true;
        },
        {
          name: "integratorConfig";
          docs: [
            "The integrator config account",
            "The account constraints here make sure that the one signing this transaction is the admin",
            "of the config",
            "The `has_one` constraint checks if admin signer is the current admin of the config",
          ];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
            ];
          };
        },
        {
          name: "integratorChainConfig";
          docs: [
            "The integrator chain config account",
            "This account will be initialized if it doesn't exist, and its bitmap will be updated",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  104,
                  97,
                  105,
                  110,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.chain_id";
              },
            ];
          };
        },
        {
          name: "adapterInfo";
          docs: [
            "The registered adapter account",
            "This makes sure that the adapter is registered. Else, it will throw",
            "`AccountNotInitialized`",
          ];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  105,
                  110,
                  102,
                  111,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.adapter_program_id";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          docs: ["The System Program"];
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "adapterInfoArgs";
            };
          };
        },
      ];
    },
    {
      name: "execMessage";
      docs: [
        "Executes a message",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
        "* `args` - The `ExecMessageArgs` struct containing:",
        "* `integrator_program_pda_bump` - The bump for the integrator program PDA",
        "* `src_chain` - The source chain ID",
        "* `src_addr` - The source address",
        "* `sequence` - The sequence number",
        "* `dst_chain` - The destination chain ID",
        "* `integrator_program_id` - The program ID of the integrator, aka dst_addr",
        "* `payload_hash` - The hash of the message payload",
      ];
      discriminator: [148, 250, 159, 138, 48, 26, 252, 90];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "integratorProgramPda";
          docs: [
            "The PDA of the integrator program.",
            "This makes sure that the one calling this is the integrator program",
          ];
          signer: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  101,
                  110,
                  100,
                  112,
                  111,
                  105,
                  110,
                  116,
                  95,
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                ];
              },
            ];
          };
        },
        {
          name: "attestationInfo";
          docs: [
            "The attestation info account",
            "This account is initialized if it doesn't exist",
          ];
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "execMessageArgs";
            };
          };
        },
      ];
    },
    {
      name: "pickUpMessage";
      docs: [
        "Picks up a message from the outbox",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction containing:",
        "* `outbox_message` - The outbox message to pick up",
        "* `adapter_info` - The adapter info account",
        "* `adapter_pda` - The adapter PDA signer",
        "* `args` - The `PickUpMessageArgs` struct containing:",
        "* `adapter_program_id` - The program ID of the adapter",
        "* `adapter_pda_bump` - The bump for the adapter PDA",
      ];
      discriminator: [186, 93, 112, 37, 117, 248, 181, 219];
      accounts: [
        {
          name: "outboxMessage";
          docs: [
            "The outbox message account to be picked up",
            "This account is mutable so we can update the `outstanding_adapters` state",
          ];
          writable: true;
        },
        {
          name: "adapterInfo";
          docs: [
            "The adapter info account",
            "This account contains index of the adapter picking up the message",
          ];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  97,
                  100,
                  97,
                  112,
                  116,
                  101,
                  114,
                  95,
                  105,
                  110,
                  102,
                  111,
                ];
              },
              {
                kind: "account";
                path: "outbox_message.src_addr";
                account: "outboxMessage";
              },
              {
                kind: "arg";
                path: "args.adapter_program_id";
              },
            ];
          };
        },
        {
          name: "adapterPda";
          docs: [
            "The adapter PDA account, used for signing",
            "This ensures that only the authorized adapter can pick up the message",
          ];
          signer: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [97, 100, 97, 112, 116, 101, 114, 95, 112, 100, 97];
              },
            ];
          };
        },
        {
          name: "refundRecipient";
          docs: [
            "The account that will receive the rent from closing the outbox message account",
          ];
          writable: true;
          relations: ["outboxMessage"];
        },
        {
          name: "systemProgram";
          docs: ["The system program account"];
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "pickUpMessageArgs";
            };
          };
        },
      ];
    },
    {
      name: "recvMessage";
      docs: [
        "Receives a message that has been attested to.",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction, containing the accounts involved",
        "* `args` - The `RecvMessageArgs` struct containing:",
        "* `integrator_program_pda_bump` - The bump seed for the integrator program PDA",
        "* `src_chain` - The source chain ID",
        "* `src_addr` - The source address as a UniversalAddress",
        "* `sequence` - The sequence number of the message",
        "* `dst_chain` - The destination chain ID",
        "* `integrator_program_id` - The program ID of the integrator, aka dst_addr",
        "* `payload_hash` - The hash of the message payload",
      ];
      discriminator: [49, 210, 56, 132, 17, 157, 18, 123];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "integratorProgramPda";
          docs: [
            "The PDA of the integrator program.",
            "This makes sure that the one calling this is the integrator program",
          ];
          signer: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  101,
                  110,
                  100,
                  112,
                  111,
                  105,
                  110,
                  116,
                  95,
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                ];
              },
            ];
          };
        },
        {
          name: "integratorChainConfig";
          docs: [
            "The integrator chain config account",
            "This is required to read the enabled_bitmap from",
          ];
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  104,
                  97,
                  105,
                  110,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.src_chain";
              },
            ];
          };
        },
        {
          name: "attestationInfo";
          docs: [
            "The attestation info account",
            "This throws when there is no attestation as there is no account initialized yet",
          ];
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "recvMessageArgs";
            };
          };
        },
      ];
    },
    {
      name: "register";
      docs: [
        "Registers an integrator and initializes their configuration",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
        "* `args` - The `RegisterArgs` struct containing:",
        "* `integrator_program_id` - The program ID of the integrator",
        "* `integrator_program_pda_bump` - The bump for the integrator_program_pda derivation",
      ];
      discriminator: [211, 124, 67, 15, 211, 194, 178, 240];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "integratorConfig";
          docs: [
            "The IntegratorConfig account being initialized",
            "`init` constraint checks that caller is not already registered",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
            ];
          };
        },
        {
          name: "sequenceTracker";
          docs: ["The SequenceTracker account being initialized"];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  115,
                  101,
                  113,
                  117,
                  101,
                  110,
                  99,
                  101,
                  95,
                  116,
                  114,
                  97,
                  99,
                  107,
                  101,
                  114,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
            ];
          };
        },
        {
          name: "integratorProgramPda";
          docs: [
            "The integrator program's PDA",
            "This makes sure that the Signer is a Integrator Program PDA Signer",
            "TODO: Ideally there is a `AccountUncheckedOwner` that does not explicitly enforce owner",
            "check on AccountUncheckedOwner<T> and use the `owner = another_program.ID` but it is not",
            "possible for now. So we have to pass in the bump manually in the args to use it here",
            "This is easier for monitoring anyways since you don't have to lookup the this account to",
            "get the integrator program id and bump",
            "Link to discussion: https://github.com/coral-xyz/anchor/issues/3285#issuecomment-2381329832",
          ];
          signer: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  101,
                  110,
                  100,
                  112,
                  111,
                  105,
                  110,
                  116,
                  95,
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                ];
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "registerArgs";
            };
          };
        },
      ];
    },
    {
      name: "sendMessage";
      docs: [
        "Sends a message through the endpoint",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
        "* `args` - The `SendMessageArgs` struct containing:",
        "* `integrator_program_id` - The program ID of the integrator",
        "* `integrator_program_pda_bump` - The bump for the integrator_program_pda derivation",
        "* `dst_chain` - The destination chain ID",
        "* `dst_addr` - The destination address",
        "* `payload_hash` - The hash of the message payload",
      ];
      discriminator: [57, 40, 34, 178, 189, 10, 65, 26];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "integratorProgramPda";
          docs: [
            "The PDA of the integrator program.",
            "This makes sure that only the integrator program is authorized to use this ix",
          ];
          signer: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  101,
                  110,
                  100,
                  112,
                  111,
                  105,
                  110,
                  116,
                  95,
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                ];
              },
            ];
          };
        },
        {
          name: "integratorChainConfig";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  104,
                  97,
                  105,
                  110,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
              {
                kind: "arg";
                path: "args.dst_chain";
              },
            ];
          };
        },
        {
          name: "sequenceTracker";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  115,
                  101,
                  113,
                  117,
                  101,
                  110,
                  99,
                  101,
                  95,
                  116,
                  114,
                  97,
                  99,
                  107,
                  101,
                  114,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
            ];
          };
        },
        {
          name: "outboxMessage";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "sendMessageArgs";
            };
          };
        },
      ];
    },
    {
      name: "transferAdmin";
      docs: [
        "Initiates the transfer of admin rights for an IntegratorConfig account",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction",
        "* `args` - The `TransferAdminArgs` struct containing:",
        "* `new_admin` - The public key of the new admin",
        "* `integrator_program_id` - The program ID of the integrator",
      ];
      discriminator: [42, 242, 66, 106, 228, 10, 111, 156];
      accounts: [
        {
          name: "admin";
          docs: ["The current admin of the IntegratorConfig account"];
          signer: true;
        },
        {
          name: "integratorConfig";
          docs: [
            "The IntegratorConfig account being transferred",
            "`has_one` constraint checks that the signer is the current admin",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
            ];
          };
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "transferAdminArgs";
            };
          };
        },
      ];
    },
    {
      name: "updateAdmin";
      docs: [
        "Updates the admin of an IntegratorConfig account",
        "",
        "# Arguments",
        "",
        "* `ctx` - The context of the instruction, containing:",
        "* `admin` - The current admin (signer)",
        "* `integrator_config` - The IntegratorConfig account to update",
        "* `args` - The `UpdateAdminArgs` struct containing:",
        "* `new_admin` - The public key of the new admin",
        "* `integrator_program_id` - The program ID of the integrator",
      ];
      discriminator: [161, 176, 40, 213, 60, 184, 179, 228];
      accounts: [
        {
          name: "admin";
          docs: ["The current admin of the IntegratorConfig account"];
          signer: true;
        },
        {
          name: "integratorConfig";
          docs: [
            "The IntegratorConfig account being transferred",
            "`has_one` constraint checks that the signer is the current admin",
          ];
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  105,
                  110,
                  116,
                  101,
                  103,
                  114,
                  97,
                  116,
                  111,
                  114,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
              {
                kind: "arg";
                path: "args.integrator_program_id";
              },
            ];
          };
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121,
                ];
              },
            ];
          };
        },
        {
          name: "program";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "updateAdminArgs";
            };
          };
        },
      ];
    },
  ];
  accounts: [
    {
      name: "adapterInfo";
      discriminator: [40, 22, 54, 111, 108, 25, 154, 197];
    },
    {
      name: "attestationInfo";
      discriminator: [231, 247, 179, 70, 29, 36, 57, 169];
    },
    {
      name: "integratorChainConfig";
      discriminator: [241, 61, 178, 53, 23, 22, 113, 121];
    },
    {
      name: "integratorConfig";
      discriminator: [222, 107, 253, 91, 117, 41, 5, 100];
    },
    {
      name: "outboxMessage";
      discriminator: [134, 18, 164, 212, 122, 45, 165, 53];
    },
    {
      name: "sequenceTracker";
      discriminator: [99, 2, 76, 112, 17, 90, 152, 113];
    },
  ];
  events: [
    {
      name: "adapterAdded";
      discriminator: [36, 170, 246, 224, 205, 60, 81, 60];
    },
    {
      name: "adminDiscarded";
      discriminator: [149, 116, 13, 10, 40, 191, 32, 177];
    },
    {
      name: "adminUpdateRequested";
      discriminator: [66, 103, 147, 208, 133, 183, 239, 204];
    },
    {
      name: "adminUpdated";
      discriminator: [69, 82, 49, 171, 43, 3, 80, 161];
    },
    {
      name: "integratorRegistered";
      discriminator: [19, 251, 101, 77, 249, 113, 33, 140];
    },
    {
      name: "messageAttestedTo";
      discriminator: [226, 121, 100, 66, 104, 47, 60, 67];
    },
    {
      name: "messageExecuted";
      discriminator: [214, 203, 124, 241, 94, 227, 41, 59];
    },
    {
      name: "messagePickedUp";
      discriminator: [147, 214, 35, 134, 92, 70, 104, 242];
    },
    {
      name: "messageReceived";
      discriminator: [231, 68, 47, 77, 173, 241, 157, 166];
    },
    {
      name: "messageSent";
      discriminator: [116, 70, 224, 76, 128, 28, 110, 55];
    },
    {
      name: "recvAdapterDisabledForChain";
      discriminator: [34, 6, 61, 129, 102, 157, 56, 198];
    },
    {
      name: "recvAdapterEnabledForChain";
      discriminator: [21, 62, 76, 37, 135, 155, 142, 104];
    },
    {
      name: "sendAdapterDisabledForChain";
      discriminator: [171, 243, 62, 81, 181, 159, 90, 9];
    },
    {
      name: "sendAdapterEnabledForChain";
      discriminator: [24, 177, 31, 65, 128, 202, 235, 214];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "callerNotAuthorized";
      msg: "Caller is not authorized";
    },
    {
      code: 6001;
      name: "bitmapIndexOutOfBounds";
      msg: "Bitmap index is out of bounds";
    },
    {
      code: 6002;
      name: "maxAdaptersReached";
      msg: "Maximum number of adapters reached";
    },
    {
      code: 6003;
      name: "adapterAlreadyEnabled";
      msg: "Adapter was already enabled";
    },
    {
      code: 6004;
      name: "adapterAlreadyDisabled";
      msg: "Adapter was already disabled";
    },
    {
      code: 6005;
      name: "adminTransferInProgress";
      msg: "An admin transfer is in progress";
    },
    {
      code: 6006;
      name: "noAdminTransferInProgress";
      msg: "No admin transfer is in progress";
    },
    {
      code: 6007;
      name: "invalidChainId";
      msg: "Invalid Chain Id";
    },
    {
      code: 6008;
      name: "adapterNotEnabled";
      msg: "No Adapters Enabled";
    },
    {
      code: 6009;
      name: "duplicateMessageAttestation";
      msg: "Duplicate Message Attestation";
    },
    {
      code: 6010;
      name: "messageAlreadyPickedUp";
      msg: "Message has already been picked up";
    },
    {
      code: 6011;
      name: "alreadyExecuted";
      msg: "Message has already been executed";
    },
    {
      code: 6012;
      name: "unknownMessageAttestation";
      msg: "Unknown Message Attestation";
    },
    {
      code: 6013;
      name: "invalidMessageHash";
      msg: "Message Hash is invalid";
    },
    {
      code: 6014;
      name: "invalidDestinationChain";
      msg: "Invalid Destination Chain Id";
    },
  ];
  types: [
    {
      name: "adapterAdded";
      docs: ["Event emitted when a new adapter is added to an integrator"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "integrator";
            type: "pubkey";
          },
          {
            name: "adapter";
            type: "pubkey";
          },
          {
            name: "adaptersNum";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "adapterInfo";
      docs: [
        "Represents a registered adapter in the Endpoint.",
        "",
        "Each adapter is associated with a specific integrator and has a unique ID",
        "within that integrator's context. It can be used across multiple chains.",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["Bump seed for PDA derivation"];
            type: "u8";
          },
          {
            name: "integratorProgramId";
            docs: [
              "The program ID of the integrator",
              "This is used as a seed for PDA derivation",
            ];
            type: "pubkey";
          },
          {
            name: "adapterProgramId";
            docs: [
              "Public key of the adapter's address",
              "This is used as a seed for PDA derivation",
            ];
            type: "pubkey";
          },
          {
            name: "index";
            docs: [
              "Index of the adapter with respect to the adapter_info vector in",
              "integratorConfig",
            ];
            type: "u8";
          },
        ];
      };
    },
    {
      name: "adapterInfoArgs";
      docs: ["Common arguments for adapter info operations"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "chainId";
            docs: ["The ID of the chain"];
            type: "u16";
          },
          {
            name: "adapterProgramId";
            docs: ["The Pubkey of the adapter"];
            type: "pubkey";
          },
          {
            name: "integratorProgramId";
            docs: ["The Pubkey of the integrator program"];
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "addAdapterArgs";
      docs: ["Arguments for the add_adapter instruction"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "integratorProgramId";
            docs: ["The Pubkey of the integrator program"];
            type: "pubkey";
          },
          {
            name: "adapterProgramId";
            docs: ["The Pubkey of the adapter to be registered"];
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "adminDiscarded";
      docs: ["Event emitted when an admin is discarded for an integrator"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "integrator";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "adminUpdateRequested";
      docs: ["Event emitted when an admin update is requested"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "integrator";
            type: "pubkey";
          },
          {
            name: "oldAdmin";
            type: "pubkey";
          },
          {
            name: "newAdmin";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "adminUpdated";
      docs: ["Event emitted when an integrator's admin is updated"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "integrator";
            type: "pubkey";
          },
          {
            name: "oldAdmin";
            type: "pubkey";
          },
          {
            name: "newAdmin";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "attestMessageArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "adapterProgramId";
            type: "pubkey";
          },
          {
            name: "adapterPdaBump";
            type: "u8";
          },
          {
            name: "srcChain";
            type: "u16";
          },
          {
            name: "srcAddr";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "sequence";
            type: "u64";
          },
          {
            name: "dstChain";
            type: "u16";
          },
          {
            name: "integratorProgramId";
            type: "pubkey";
          },
          {
            name: "payloadHash";
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
    {
      name: "attestationInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["Bump seed for PDA derivation"];
            type: "u8";
          },
          {
            name: "messageHash";
            docs: [
              "Message hash (32 bytes)",
              "Used as a seed for PDA derivation",
            ];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "srcChain";
            docs: ["Source chain ID"];
            type: "u16";
          },
          {
            name: "srcAddr";
            docs: ["Source address (32 bytes)"];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "sequence";
            docs: ["Sequence number"];
            type: "u64";
          },
          {
            name: "dstChain";
            docs: ["Destination chain ID"];
            type: "u16";
          },
          {
            name: "dstAddr";
            docs: ["Destination address (32 bytes)"];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "payloadHash";
            docs: ["Payload hash (32 bytes)"];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "executed";
            docs: ["Replay protection flag"];
            type: "bool";
          },
          {
            name: "attestedAdapters";
            docs: [
              "The bitmap of receive-enabled adapters for this source chain that have attested to the message",
            ];
            type: {
              defined: {
                name: "bitmap";
              };
            };
          },
        ];
      };
    },
    {
      name: "bitmap";
      type: {
        kind: "struct";
        fields: [
          {
            name: "map";
            type: "u128";
          },
        ];
      };
    },
    {
      name: "execMessageArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "integratorProgramPdaBump";
            type: "u8";
          },
          {
            name: "srcChain";
            type: "u16";
          },
          {
            name: "srcAddr";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "sequence";
            type: "u64";
          },
          {
            name: "dstChain";
            type: "u16";
          },
          {
            name: "integratorProgramId";
            type: "pubkey";
          },
          {
            name: "payloadHash";
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
    {
      name: "integratorChainConfig";
      docs: [
        "Manages the adapters for a specific integrator on a particular chain.",
        "",
        "This struct keeps track of both receive and send adapters",
        "using bitmaps for efficient storage and lookup.",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["Bump seed for PDA derivation"];
            type: "u8";
          },
          {
            name: "integratorProgramId";
            docs: [
              "The program ID of the integrator",
              "This is used as a seed for PDA derivation",
            ];
            type: "pubkey";
          },
          {
            name: "chainId";
            docs: [
              "Identifier for the blockchain",
              "This is used as a seed for PDA derivation",
            ];
            type: "u16";
          },
          {
            name: "sendAdapterBitmap";
            docs: ["Bitmap tracking the status of send adapters"];
            type: {
              defined: {
                name: "bitmap";
              };
            };
          },
          {
            name: "recvAdapterBitmap";
            docs: ["Bitmap tracking the status of receive adapters"];
            type: {
              defined: {
                name: "bitmap";
              };
            };
          },
        ];
      };
    },
    {
      name: "integratorConfig";
      docs: ["Manages the configuration for a specific integrator."];
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["Bump seed for PDA derivation"];
            type: "u8";
          },
          {
            name: "integratorProgramId";
            docs: [
              "Program ID associated with this integrator",
              "This is used as a seed for PDA derivation",
            ];
            type: "pubkey";
          },
          {
            name: "admin";
            docs: ["Admin of the IntegratorConfig account"];
            type: {
              option: "pubkey";
            };
          },
          {
            name: "pendingAdmin";
            docs: [
              "Pending admin of the IntegratorConfig account",
              "If this exists, any other admin related functions will not be authorised",
              "This must be null (in other words claim_admin will need to be called) before other ixs are",
              "enabled",
            ];
            type: {
              option: "pubkey";
            };
          },
          {
            name: "adapterInfos";
            docs: ["Vector of registered adapter addresses"];
            type: {
              vec: "pubkey";
            };
          },
        ];
      };
    },
    {
      name: "integratorRegistered";
      docs: ["Event emitted when a new integrator is registered"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "integrator";
            type: "pubkey";
          },
          {
            name: "admin";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "messageAttestedTo";
      docs: ["Event emitted when a message is attested to by an adapter"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "messageHash";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "srcChain";
            type: "u16";
          },
          {
            name: "srcAddr";
            type: {
              defined: {
                name: "universalAddress";
              };
            };
          },
          {
            name: "sequence";
            type: "u64";
          },
          {
            name: "dstChain";
            type: "u16";
          },
          {
            name: "dstAddr";
            type: {
              defined: {
                name: "universalAddress";
              };
            };
          },
          {
            name: "payloadHash";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "attestedBitmap";
            type: "u128";
          },
          {
            name: "attestingAdapter";
            type: {
              defined: {
                name: "universalAddress";
              };
            };
          },
        ];
      };
    },
    {
      name: "messageExecuted";
      docs: ["Event emitted when a message is executed"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "messageHash";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "srcChain";
            type: "u16";
          },
          {
            name: "srcAddr";
            type: {
              defined: {
                name: "universalAddress";
              };
            };
          },
          {
            name: "sequence";
            type: "u64";
          },
          {
            name: "dstChain";
            type: "u16";
          },
          {
            name: "dstAddr";
            type: {
              defined: {
                name: "universalAddress";
              };
            };
          },
          {
            name: "payloadHash";
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
    {
      name: "messagePickedUp";
      docs: ["Event emitted when a message is picked up by an adapter"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "srcAddr";
            type: {
              defined: {
                name: "universalAddress";
              };
            };
          },
          {
            name: "sequence";
            type: "u64";
          },
          {
            name: "dstChain";
            type: "u16";
          },
          {
            name: "dstAddr";
            type: {
              defined: {
                name: "universalAddress";
              };
            };
          },
          {
            name: "payloadHash";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "adapter";
            type: "pubkey";
          },
          {
            name: "remainingAdapters";
            type: "u128";
          },
        ];
      };
    },
    {
      name: "messageReceived";
      docs: ["Event emitted when a message is received"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "messageHash";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "srcChain";
            type: "u16";
          },
          {
            name: "srcAddr";
            type: {
              defined: {
                name: "universalAddress";
              };
            };
          },
          {
            name: "sequence";
            type: "u64";
          },
          {
            name: "dstChain";
            type: "u16";
          },
          {
            name: "dstAddr";
            type: {
              defined: {
                name: "universalAddress";
              };
            };
          },
          {
            name: "payloadHash";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "enabledBitmap";
            type: "u128";
          },
          {
            name: "attestedBitmap";
            type: "u128";
          },
        ];
      };
    },
    {
      name: "messageSent";
      docs: ["Event emitted when a message is sent"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "sender";
            type: {
              defined: {
                name: "universalAddress";
              };
            };
          },
          {
            name: "sequence";
            type: "u64";
          },
          {
            name: "recipient";
            type: {
              defined: {
                name: "universalAddress";
              };
            };
          },
          {
            name: "recipientChain";
            type: "u16";
          },
          {
            name: "payloadDigest";
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
    {
      name: "outboxMessage";
      type: {
        kind: "struct";
        fields: [
          {
            name: "srcAddr";
            docs: ["The sending integrator as a 32-byte universal address"];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "sequence";
            docs: ["The sequence number of the message"];
            type: "u64";
          },
          {
            name: "dstChain";
            docs: ["The destination chain's Wormhole Chain ID"];
            type: "u16";
          },
          {
            name: "dstAddr";
            docs: ["The destination address as a 32-byte universal address"];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "payloadHash";
            docs: ["The keccak256 of an arbitrary payload (32 bytes)"];
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "outstandingAdapters";
            docs: [
              "The bitmap of send-enabled adapters for this destination chain that have not picked up the message",
            ];
            type: {
              defined: {
                name: "bitmap";
              };
            };
          },
          {
            name: "refundRecipient";
            docs: ["The recipient of the lamports when this account is closed"];
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "pickUpMessageArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "adapterProgramId";
            type: "pubkey";
          },
          {
            name: "adapterPdaBump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "recvAdapterDisabledForChain";
      docs: [
        "Event emitted when a receive adapter is disabled for a specific chain",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "integrator";
            type: "pubkey";
          },
          {
            name: "chain";
            type: "u16";
          },
          {
            name: "adapter";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "recvAdapterEnabledForChain";
      docs: [
        "Event emitted when a receive adapter is enabled for a specific chain",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "integrator";
            type: "pubkey";
          },
          {
            name: "chain";
            type: "u16";
          },
          {
            name: "adapter";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "recvMessageArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "integratorProgramPdaBump";
            type: "u8";
          },
          {
            name: "srcChain";
            type: "u16";
          },
          {
            name: "srcAddr";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "sequence";
            type: "u64";
          },
          {
            name: "dstChain";
            type: "u16";
          },
          {
            name: "integratorProgramId";
            type: "pubkey";
          },
          {
            name: "payloadHash";
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
    {
      name: "registerArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "integratorProgramId";
            type: "pubkey";
          },
          {
            name: "integratorProgramPdaBump";
            type: "u8";
          },
          {
            name: "admin";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "sendAdapterDisabledForChain";
      docs: [
        "Event emitted when a send adapter is disabled for a specific chain",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "integrator";
            type: "pubkey";
          },
          {
            name: "chain";
            type: "u16";
          },
          {
            name: "adapter";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "sendAdapterEnabledForChain";
      docs: [
        "Event emitted when a send adapter is enabled for a specific chain",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "integrator";
            type: "pubkey";
          },
          {
            name: "chain";
            type: "u16";
          },
          {
            name: "adapter";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "sendMessageArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "integratorProgramId";
            type: "pubkey";
          },
          {
            name: "integratorProgramPdaBump";
            type: "u8";
          },
          {
            name: "dstChain";
            type: "u16";
          },
          {
            name: "dstAddr";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "payloadHash";
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
    {
      name: "sequenceTracker";
      docs: [
        "Tracks the sequence number for an integrator program",
        "We could have put this in the `IntegratorConfig` account,",
        "but due to the frequent writes to the `sequence` field, we",
        "made it another account to prevent unnecessary account write locks.",
        "This way we separate the concerns of Integrator config vs sequence",
        "tracking better.",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "bump";
            docs: ["Bump seed for PDA derivation"];
            type: "u8";
          },
          {
            name: "integratorProgramId";
            docs: [
              "The program ID of the integrator",
              "This is used as a seed for PDA derivation",
            ];
            type: "pubkey";
          },
          {
            name: "sequence";
            docs: ["The current sequence number for this integrator"];
            type: "u64";
          },
        ];
      };
    },
    {
      name: "transferAdminArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "newAdmin";
            docs: ["The new_admin to be assigned"];
            type: "pubkey";
          },
          {
            name: "integratorProgramId";
            docs: ["The integrator_program for the integrator_config"];
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "universalAddress";
      docs: [
        "UniversalAddress represents a 32-byte address that can be used across different chains",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "bytes";
            docs: ["The raw 32-byte address"];
            type: {
              array: ["u8", 32];
            };
          },
        ];
      };
    },
    {
      name: "updateAdminArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "newAdmin";
            docs: ["The new_admin to be assigned"];
            type: "pubkey";
          },
          {
            name: "integratorProgramId";
            docs: ["The integrator_program for the integrator_config"];
            type: "pubkey";
          },
        ];
      };
    },
  ];
};
