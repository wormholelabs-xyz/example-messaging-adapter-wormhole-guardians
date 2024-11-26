/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/mock_integrator.json`.
 */
export type MockIntegrator = {
  address: "";
  metadata: {
    name: "mockIntegrator";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  docs: [
    "This module serves as a mock integrator to demonstrate how to call the register function",
    "in the endpoint program. It's designed to simulate the process of registering an integrator,",
    "which requires a Cross-Program Invocation (CPI) call with a Program Derived Address (PDA) signer.",
  ];
  instructions: [
    {
      name: "invokeExecMessage";
      docs: [
        "Invokes the exec_message instruction on the endpoint program via CPI",
      ];
      discriminator: [129, 108, 77, 15, 123, 111, 235, 33];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "integratorProgramPda";
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
          docs: ["The attestation info account"];
          writable: true;
        },
        {
          name: "eventAuthority";
          docs: ["The event authority PDA"];
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
        {
          name: "systemProgram";
          docs: ["The system program"];
          address: "11111111111111111111111111111111";
        },
        {
          name: "endpointProgram";
          docs: ["The endpoint program"];
          address: "FMPF1RnXz1vvZ6eovoEQqMPXYRUgYqFKFMXzTJkbWWVD";
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
      name: "invokeRecvMessage";
      docs: [
        "Invokes the recv_message instruction on the endpoint program via CPI",
      ];
      discriminator: [167, 145, 80, 205, 25, 193, 214, 11];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "integratorProgramPda";
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
          docs: ["The attestation info account"];
          writable: true;
        },
        {
          name: "integratorChainConfig";
          docs: ["The integrator chain config account"];
        },
        {
          name: "eventAuthority";
          docs: ["The event authority PDA"];
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
        {
          name: "systemProgram";
          docs: ["The system program"];
          address: "11111111111111111111111111111111";
        },
        {
          name: "endpointProgram";
          docs: ["The endpoint program"];
          address: "FMPF1RnXz1vvZ6eovoEQqMPXYRUgYqFKFMXzTJkbWWVD";
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
      name: "invokeRegister";
      docs: [
        "Invokes the register function in the endpoint program via a CPI call.",
        "This function demonstrates how to properly set up the accounts and sign the transaction",
        "using a PDA, which is required for the registration process.",
      ];
      discriminator: [85, 62, 89, 129, 245, 134, 142, 172];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "integratorConfig";
          writable: true;
        },
        {
          name: "sequenceTracker";
          writable: true;
        },
        {
          name: "integratorProgramPda";
          docs: ["The integrator program's PDA"];
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
          name: "eventAuthority";
          docs: ["The event authority PDA"];
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
        {
          name: "systemProgram";
          docs: ["The System Program"];
          address: "11111111111111111111111111111111";
        },
        {
          name: "endpointProgram";
          address: "FMPF1RnXz1vvZ6eovoEQqMPXYRUgYqFKFMXzTJkbWWVD";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "invokeRegisterArgs";
            };
          };
        },
      ];
    },
    {
      name: "invokeSendMessage";
      discriminator: [255, 171, 48, 229, 61, 31, 28, 202];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "integratorProgramPda";
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
          writable: true;
        },
        {
          name: "outboxMessage";
          writable: true;
          signer: true;
        },
        {
          name: "sequenceTracker";
          writable: true;
        },
        {
          name: "eventAuthority";
          docs: ["The event authority PDA"];
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
        {
          name: "endpointProgram";
          address: "FMPF1RnXz1vvZ6eovoEQqMPXYRUgYqFKFMXzTJkbWWVD";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "args";
          type: {
            defined: {
              name: "invokeSendMessageArgs";
            };
          };
        },
      ];
    },
  ];
  types: [
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
      name: "invokeRegisterArgs";
      type: {
        kind: "struct";
        fields: [
          {
            name: "admin";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "invokeSendMessageArgs";
      type: {
        kind: "struct";
        fields: [
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
  ];
};
