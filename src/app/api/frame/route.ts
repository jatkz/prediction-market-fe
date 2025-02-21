// import { NextRequest, NextResponse } from 'next/server';
// import { NeynarAPIClient } from '@neynar/nodejs-sdk';
// import { ethers } from 'ethers';
// import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/prediction-market';

// // Initialize Neynar client
// const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY as string;
// const neynar = new NeynarAPIClient({ apiKey: NEYNAR_API_KEY });

// export async function GET(req: NextRequest) {
//   // Serve the initial frame HTML
//   return new NextResponse(`
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta property="fc:frame" content="vNext" />
//         <meta property="fc:frame:image" content="${process.env.HOST_URL}/api/frame-image" />
//         <meta property="fc:frame:button:1" content="Create Market" />
//         <meta property="fc:frame:input:text" content="Enter market question" />
//       </head>
//     </html>
//   `, {
//     headers: {
//       'Content-Type': 'text/html',
//     },
//   });
// }

// export async function POST(req: NextRequest) {
//   try {
//     // 1. Validate Frame Action
//     const body = await req.json();
//     const { isValid, frame } = await neynar.validateFr ameAction(body);

//     if (!isValid) {
//       return new NextResponse('Invalid frame action', { status: 400 });
//     }

//     // 2. Get User Information
//     const { fid, username, custody_address } = frame.user;
//     console.log(`User ${username} (FID: ${fid}) interacting with frame`);

//     // 3. Process Frame Action
//     const question = frame.input?.text?.trim();
//     if (!question) {
//       return new NextResponse(`
//         <!DOCTYPE html>
//         <html>
//           <head>
//             <meta property="fc:frame" content="vNext" />
//             <meta property="fc:frame:image" content="${process.env.HOST_URL}/api/error-image" />
//             <meta property="fc:frame:button:1" content="Try Again" />
//           </head>
//         </html>
//       `, {
//         headers: { 'Content-Type': 'text/html' },
//       });
//     }

//     // Connect to contract
//     const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
//     const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
//     const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

//     // Create market
//     const tx = await contract.createMarket(question);
//     await tx.wait();

//     // 4. Post Confirmation Cast
//     const marketUrl = `${process.env.APP_URL}/market/${tx.hash}`;
//     await neynar.publishCast(process.env.NEYNAR_SIGNER_UUID, {
//       text: `New market created by @${username}:\n"${question}"\n\nParticipate here: ${marketUrl}`,
//       embeds: [{ url: marketUrl }],
//     });

//     // Return success frame
//     return new NextResponse(`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta property="fc:frame" content="vNext" />
//           <meta property="fc:frame:image" content="${process.env.HOST_URL}/api/success-image" />
//           <meta property="fc:frame:button:1" content="View Market" />
//           <meta property="fc:frame:button:1:action" content="link" />
//           <meta property="fc:frame:button:1:target" content="${marketUrl}" />
//         </head>
//       </html>
//     `, {
//       headers: { 'Content-Type': 'text/html' },
//     });

//   } catch (error) {
//     console.error('Error processing frame action:', error);
//     return new NextResponse(`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta property="fc:frame" content="vNext" />
//           <meta property="fc:frame:image" content="${process.env.HOST_URL}/api/error-image" />
//           <meta property="fc:frame:button:1" content="Try Again" />
//         </head>
//       </html>
//     `, {
//       headers: { 'Content-Type': 'text/html' },
//     });
//   }
// }