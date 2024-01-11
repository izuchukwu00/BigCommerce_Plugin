const WebSocket = require('ws');
const http = require('http');
const express = require("express");
const socketserver = http.createServer();
// const Redis = require('ioredis');
// const redisClient = new Redis();

// const cors = require('cors'); // Import the cors package
// Enable CORS by setting the appropriate headers
// socketserver.on('request', (req, res) => {
//     res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust the origin as needed
//     res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, DELETE');
//
//     if (req.method === 'OPTIONS') {
//         res.writeHead(200);
//         res.end();
//     }
//
//     // ... rest of your request handling logic
// });

const wss = new WebSocket.Server({ noServer: true });

const redisClient = require('./redis'); // Adjust the path as needed

// Now you can use `redisClient` to interact with Redis
// const reference = Math.ceil(Math.random()*10**16);
// let reference;

// redisClient.get('myKey', (err, result) => {
//     if (err) {
//         console.error('Error:', err);
//     } else {
//         console.log('Value:', result);
//     }
// });

const Redis = require('ioredis');
const redis = new Redis(); // Connect to your Redis server

// Initialize a cursor with value 0
let cursor = 0;
let ref;
let reference;


// // Delete a single key
// redis.del('2f473a22-b55d-4678-a863-ffa8da77fbfe', (err, result) => {
//     if (err) {
//         console.error(err);
//     } else {
//         console.log(`Deleted ${result} keys`);
//     }
// });


// (async () => {
//     const allKeysAndValues = {};
//
//     while (true) {
//         const [newCursor, keys] = await redis.scan(cursor, 'MATCH', '*');
//
//         // Iterate through the keys and get their values
//         for (const key of keys) {
//             const value = await redis.get(key);
//             allKeysAndValues[key] = value;
//         }
//
//         // Update the cursor for the next iteration
//         cursor = newCursor;
//
//         // Check if the iteration has finished
//         if (cursor === '0') {
//             break;
//         }
//     }
//
//     console.log('All Keys and Values:', allKeysAndValues);
//     redis.quit(); // Close the Redis connection when done
// })();



let receivedMessage; // Declare a variable to store the message

const clients = new Map(); // Map to associate client IDs with WebSocket instances


wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established');

    const requestedPath = req.url;
    console.log(requestedPath);
    if (requestedPath === '/auth') {
        clients.set('auth', ws); // Store the WebSocket instance with its associated client ID
    }
    if (requestedPath === '/cap') {
        clients.set('cap', ws); // Store the WebSocket instance with its associated client ID
    }

    ws.on('message', (message) => {
        if (typeof message === 'string') {
            // Handle text messages
            // console.log(`Received WebSocket Client message: ${message}`);
            // receivedMessage = message; // Store the message as text
            const par = JSON.parse(message);
            const mess = par.orderAttempts;
            const autho = par.authorization_url;
            redisClient.set(`${mess}`, JSON.stringify({'authorization_url': autho}));

        }
        else if (message instanceof Buffer) {
            // Handle binary messages by converting them to text
            const textMessage = message.toString('utf-8'); // Convert to UTF-8 text

            const par = JSON.parse(textMessage);
            const mess = par.orderAttempts;
            const autho = par.authorization_url;
            redisClient.set(`${mess}`, JSON.stringify({'authorization_url': autho}));

        }
    });
});

socketserver.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});


socketserver.on('request', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust the origin as needed
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, DELETE');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
    } else {

        if (req.method === 'POST' && req.url === '/send') {
            let body = '';

            req.on('data', (chunk) => {
                body += chunk;
            });

            req.on('end', () => {
                // Broadcast the received HTTP request body to all WebSocket clients

                // wss.clients.forEach((client) => {
                //     if (client.readyState === WebSocket.OPEN) {
                //         client.send(body);
                //     }
                // });

                const clientA = clients.get('auth');
                // console.log(clientA);

                if (clientA.readyState === WebSocket.OPEN) {
                    // console.log(clientA);
                    clientA.send(body);
                }

                // wss.clients.forEach((client) => {
                //     const requestedPath = req.url;
                //     console.log(client);

                //     if (client.readyState === WebSocket.OPEN && requestedPath === '/client-type-1') {

                //         client.send(body);
                //     }
                // });

                // wss.clients.send(body);


                // wss.on('connection', (client) => {
                //     console.log(body);
                //     client.send(body);
                // });


                const bd = JSON.parse(body);
                console.log(bd.authorization_url);
                console.log(bd.checkoutId);
                console.log(bd.orderAttempts);

                ref = bd.orderAttempts;

                async function getValueWithPolling(key) {
                    return new Promise(async (resolve) => {
                        async function poll() {
                            const value = await redisClient.get(key);
                            if (value !== null) {
                                resolve(value);
                            } else {
                                // If the value is not set, wait for a while and then poll again
                                setTimeout(poll, 1000); // Adjust the polling interval as needed
                            }
                        }

                        // Start the polling
                        poll();
                    });
                }

                (async () => {
                    try {
                        const value = await getValueWithPolling(`${ref}`);

                        console.log('Valuettt:', value, typeof value);
                        // Send the WebSocket message response to the HTTP client
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(value || '');

                    } catch (err) {
                        console.error('Error:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                    } finally {
                        // redisClient.quit(); // Close the Redis connection
                    }
                })();




                // Send a JSON response back to the HTTP client
                // const jsonResponse = {receivedMessage: "recedMessage"};
                // res.writeHead(200, {'Content-Type': 'application/json'});
                // res.end(JSON.stringify(jsonResponse));
                // res.end(jsonResponse);
            });
        }
        else if (req.method === 'POST' && req.url === '/cap') {
            let body = '';

            req.on('data', (chunk) => {
                body += chunk;
            });

            req.on('end', () => {
                // Broadcast the received HTTP request body to all WebSocket clients

                // wss.clients.forEach((client) => {
                //     if (client.readyState === WebSocket.OPEN) {
                //         client.send(body);
                //     }
                // });

                const clientB = clients.get('cap');
                // console.log(clientA);

                if (clientB.readyState === WebSocket.OPEN) {
                    // console.log(clientA);
                    clientB.send(body);
                }

                const bd = JSON.parse(body);


                ref = bd.orderAttempts;

                async function getValueWithPolling(key) {
                    return new Promise(async (resolve) => {
                        async function poll() {
                            const value = await redisClient.get(key);
                            if (value !== null) {
                                resolve(value);
                            } else {
                                // If the value is not set, wait for a while and then poll again
                                setTimeout(poll, 1000); // Adjust the polling interval as needed
                            }
                        }

                        // Start the polling
                        poll();
                    });
                }

                (async () => {
                    try {
                        const value = await getValueWithPolling(`${ref}`);

                        console.log('Valuecap:', value);
                        // Send the WebSocket message response to the HTTP client
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(value || '');
                        // res.end('{"aaa": "bbb3"}');

                    } catch (err) {
                        console.error('Error:', err);
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Internal Server Error');
                    } finally {
                        // redisClient.quit(); // Close the Redis connection
                    }
                })();

            });
        }
        else {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Not Found');
        }
    }
});


// Start the server
const port = 8080; // Port for serving files

socketserver.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


// 2] <ref *1> WebSocket {
//     [2]   _events: [Object: null prototype] {
//     [2]     close: [Function (anonymous)],
//     [2]     message: [Function (anonymous)]
//     [2]   },
//     [2]   _eventsCount: 2,
//     [2]   _maxListeners: undefined,
//     [2]   _binaryType: 'nodebuffer',
//     [2]   _closeCode: 1006,
//     [2]   _closeFrameReceived: false,
//     [2]   _closeFrameSent: false,
//     [2]   _closeMessage: <Buffer >,
//     [2]   _closeTimer: null,
//     [2]   _extensions: {},
//     [2]   _paused: false,
//     [2]   _protocol: '',
//     [2]   _readyState: 1,
//     [2]   _receiver: Receiver {
//     [2]     _writableState: WritableState {
//     [2]       objectMode: false,
//     [2]       highWaterMark: 16384,
//     [2]       finalCalled: false,
//     [2]       needDrain: false,
//     [2]       ending: false,
//     [2]       ended: false,
//     [2]       finished: false,
//     [2]       destroyed: false,
//     [2]       decodeStrings: true,
//     [2]       defaultEncoding: 'utf8',
//     [2]       length: 0,
//     [2]       writing: false,
//     [2]       corked: 0,
//     [2]       sync: true,
//     [2]       bufferProcessing: false,
//     [2]       onwrite: [Function: bound onwrite],
//     [2]       writecb: null,
//     [2]       writelen: 0,
//     [2]       afterWriteTickInfo: null,
//     [2]       buffered: [],
//     [2]       bufferedIndex: 0,
//     [2]       allBuffers: true,
//     [2]       allNoop: true,
//     [2]       pendingcb: 0,
//     [2]       prefinished: false,
//     [2]       errorEmitted: false,
//     [2]       emitClose: true,
//     [2]       autoDestroy: true,
//     [2]       errored: null,
//     [2]       closed: false
//     [2]     },
//     [2]     _events: [Object: null prototype] {
//     [2]       conclude: [Function: receiverOnConclude],
//     [2]       drain: [Function: receiverOnDrain],
//     [2]       error: [Function: receiverOnError],
//     [2]       message: [Function: receiverOnMessage],
//     [2]       ping: [Function: receiverOnPing],
//     [2]       pong: [Function: receiverOnPong]
//     [2]     },
//     [2]     _eventsCount: 6,
//     [2]     _maxListeners: undefined,
//     [2]     _binaryType: 'nodebuffer',
//     [2]     _extensions: {},
//     [2]     _isServer: true,
//     [2]     _maxPayload: 104857600,
//     [2]     _skipUTF8Validation: false,
//     [2]     _bufferedBytes: 0,
//     [2]     _buffers: [],
//     [2]     _compressed: false,
//     [2]     _payloadLength: 0,
//     [2]     _mask: undefined,
//     [2]     _fragmented: 0,
//     [2]     _masked: false,
//     [2]     _fin: false,
//     [2]     _opcode: 0,
//     [2]     _totalPayloadLength: 0,
//     [2]     _messageLength: 0,
//     [2]     _fragments: [],
//     [2]     _state: 0,
//     [2]     _loop: false,
//     [2]     [Symbol(kCapture)]: false,
//     [2]     [Symbol(websocket)]: [Circular *1]
//     [2]   },
//     [2]   _sender: Sender {
//     [2]     _extensions: {},
//     [2]     _socket: Socket {
//     [2]       connecting: false,
//     [2]       _hadError: false,
//     [2]       _parent: null,
//     [2]       _host: null,
//     [2]       _readableState: [ReadableState],
//     [2]       _events: [Object: null prototype],
//     [2]       _eventsCount: 4,
//     [2]       _maxListeners: undefined,
//     [2]       _writableState: [WritableState],
//     [2]       allowHalfOpen: true,
//     [2]       _sockname: null,
//     [2]       _pendingData: null,
//     [2]       _pendingEncoding: '',
//     [2]       server: [Server],
//     [2]       _server: [Server],
//     [2]       parser: null,
//     [2]       on: [Function (anonymous)],
//     [2]       addListener: [Function (anonymous)],
//     [2]       prependListener: [Function: prependListener],
//     [2]       _paused: false,
//     [2]       timeout: 0,
//     [2]       [Symbol(async_id_symbol)]: 30,
//     [2]       [Symbol(kHandle)]: [TCP],
//     [2]       [Symbol(kSetNoDelay)]: true,
//     [2]       [Symbol(lastWriteQueueSize)]: 0,
//     [2]       [Symbol(timeout)]: null,
//     [2]       [Symbol(kBuffer)]: null,
//     [2]       [Symbol(kBufferCb)]: null,
//     [2]       [Symbol(kBufferGen)]: null,
//     [2]       [Symbol(kCapture)]: false,
//     [2]       [Symbol(kBytesRead)]: 0,
//     [2]       [Symbol(kBytesWritten)]: 0,
//     [2]       [Symbol(RequestTimeout)]: undefined,
//     [2]       [Symbol(websocket)]: [Circular *1]
//     [2]     },
//     [2]     _firstFragment: true,
//     [2]     _compress: false,
//     [2]     _bufferedBytes: 0,
//     [2]     _deflating: false,
//     [2]     _queue: []
//     [2]   },
//     [2]   _socket: <ref *2> Socket {
//     [2]     connecting: false,
//     [2]     _hadError: false,
//     [2]     _parent: null,
//     [2]     _host: null,
//     [2]     _readableState: ReadableState {
//     [2]       objectMode: false,
//     [2]       highWaterMark: 16384,
//     [2]       buffer: BufferList { head: null, tail: null, length: 0 },
//     [2]       length: 0,
//     [2]       pipes: [],
//     [2]       flowing: true,
//     [2]       ended: false,
//     [2]       endEmitted: false,
//     [2]       reading: true,
//     [2]       sync: false,
//     [2]       needReadable: true,
//     [2]       emittedReadable: false,
//     [2]       readableListening: false,
//     [2]       resumeScheduled: false,
//     [2]       errorEmitted: false,
//     [2]       emitClose: false,
//     [2]       autoDestroy: false,
//     [2]       destroyed: false,
//     [2]       errored: null,
//     [2]       closed: false,
//     [2]       closeEmitted: false,
//     [2]       defaultEncoding: 'utf8',
//     [2]       awaitDrainWriters: null,
//     [2]       multiAwaitDrain: false,
//     [2]       readingMore: false,
//     [2]       decoder: null,
//     [2]       encoding: null,
//     [2]       [Symbol(kPaused)]: false
//     [2]     },
//     [2]     _events: [Object: null prototype] {
//     [2]       end: [Array],
//     [2]       close: [Function: socketOnClose],
//     [2]       data: [Function: socketOnData],
//     [2]       error: [Function: socketOnError]
//     [2]     },
//     [2]     _eventsCount: 4,
//     [2]     _maxListeners: undefined,
//     [2]     _writableState: WritableState {
//     [2]       objectMode: false,
//     [2]       highWaterMark: 16384,
//     [2]       finalCalled: false,
//     [2]       needDrain: false,
//     [2]       ending: false,
//     [2]       ended: false,
//     [2]       finished: false,
//     [2]       destroyed: false,
//     [2]       decodeStrings: false,
//     [2]       defaultEncoding: 'utf8',
//     [2]       length: 0,
//     [2]       writing: false,
//     [2]       corked: 0,
//     [2]       sync: false,
//     [2]       bufferProcessing: false,
//     [2]       onwrite: [Function: bound onwrite],
//     [2]       writecb: null,
//     [2]       writelen: 0,
//     [2]       afterWriteTickInfo: null,
//     [2]       buffered: [],
//     [2]       bufferedIndex: 0,
//     [2]       allBuffers: true,
//     [2]       allNoop: true,
//     [2]       pendingcb: 0,
//     [2]       prefinished: false,
//     [2]       errorEmitted: false,
//     [2]       emitClose: false,
//     [2]       autoDestroy: false,
//     [2]       errored: null,
//     [2]       closed: false,
//     [2]       closeEmitted: false
//     [2]     },
//     [2]     allowHalfOpen: true,
//     [2]     _sockname: null,
//     [2]     _pendingData: null,
//     [2]     _pendingEncoding: '',
//     [2]     server: Server {
//     [2]       maxHeaderSize: undefined,
//     [2]       insecureHTTPParser: undefined,
//     [2]       _events: [Object: null prototype],
//     [2]       _eventsCount: 3,
//     [2]       _maxListeners: undefined,
//     [2]       _connections: 3,
//     [2]       _handle: [TCP],
//     [2]       _usingWorkers: false,
//     [2]       _workers: [],
//     [2]       _unref: false,
//     [2]       allowHalfOpen: true,
//     [2]       pauseOnConnect: false,
//     [2]       httpAllowHalfOpen: false,
//     [2]       timeout: 0,
//     [2]       keepAliveTimeout: 5000,
//     [2]       maxHeadersCount: null,
//     [2]       headersTimeout: 60000,
//     [2]       requestTimeout: 0,
//     [2]       _connectionKey: '6::::8080',
//     [2]       [Symbol(IncomingMessage)]: [Function: IncomingMessage],
//     [2]       [Symbol(ServerResponse)]: [Function: ServerResponse],
//     [2]       [Symbol(kCapture)]: false,
//     [2]       [Symbol(async_id_symbol)]: 8
//     [2]     },
//     [2]     _server: Server {
//     [2]       maxHeaderSize: undefined,
//     [2]       insecureHTTPParser: undefined,
//     [2]       _events: [Object: null prototype],
//     [2]       _eventsCount: 3,
//     [2]       _maxListeners: undefined,
//     [2]       _connections: 3,
//     [2]       _handle: [TCP],
//     [2]       _usingWorkers: false,
//     [2]       _workers: [],
//     [2]       _unref: false,
//     [2]       allowHalfOpen: true,
//     [2]       pauseOnConnect: false,
//     [2]       httpAllowHalfOpen: false,
//     [2]       timeout: 0,
//     [2]       keepAliveTimeout: 5000,
//     [2]       maxHeadersCount: null,
//     [2]       headersTimeout: 60000,
//     [2]       requestTimeout: 0,
//     [2]       _connectionKey: '6::::8080',
//     [2]       [Symbol(IncomingMessage)]: [Function: IncomingMessage],
//     [2]       [Symbol(ServerResponse)]: [Function: ServerResponse],
//     [2]       [Symbol(kCapture)]: false,
//     [2]       [Symbol(async_id_symbol)]: 8
//     [2]     },
//     [2]     parser: null,
//     [2]     on: [Function (anonymous)],
//     [2]     addListener: [Function (anonymous)],
//     [2]     prependListener: [Function: prependListener],
//     [2]     _paused: false,
//     [2]     timeout: 0,
//     [2]     [Symbol(async_id_symbol)]: 30,
//     [2]     [Symbol(kHandle)]: TCP {
//     [2]       reading: true,
//     [2]       onconnection: null,
//     [2]       _consumed: true,
//     [2]       [Symbol(owner_symbol)]: [Circular *2]
//     [2]     },
//     [2]     [Symbol(kSetNoDelay)]: true,
//     [2]     [Symbol(lastWriteQueueSize)]: 0,
//     [2]     [Symbol(timeout)]: null,
//     [2]     [Symbol(kBuffer)]: null,
//     [2]     [Symbol(kBufferCb)]: null,
//     [2]     [Symbol(kBufferGen)]: null,
//     [2]     [Symbol(kCapture)]: false,
//     [2]     [Symbol(kBytesRead)]: 0,
//     [2]     [Symbol(kBytesWritten)]: 0,
//     [2]     [Symbol(RequestTimeout)]: undefined,
//     [2]     [Symbol(websocket)]: [Circular *1]
//     [2]   },
//     [2]   _isServer: true,
//     [2]   [Symbol(kCapture)]: false
//     [2] }
//     [2] <ref *1> WebSocket {
//     [2]   _events: [Object: null prototype] {
//     [2]     close: [Function (anonymous)],
//     [2]     message: [Function (anonymous)]
//     [2]   },
//     [2]   _eventsCount: 2,
//     [2]   _maxListeners: undefined,
//     [2]   _binaryType: 'nodebuffer',
//     [2]   _closeCode: 1006,
//     [2]   _closeFrameReceived: false,
//     [2]   _closeFrameSent: false,
//     [2]   _closeMessage: <Buffer >,
//     [2]   _closeTimer: null,
//     [2]   _extensions: {},
//     [2]   _paused: false,
//     [2]   _protocol: '',
//     [2]   _readyState: 1,
//     [2]   _receiver: Receiver {
//     [2]     _writableState: WritableState {
//     [2]       objectMode: false,
//     [2]       highWaterMark: 16384,
//     [2]       finalCalled: false,
//     [2]       needDrain: false,
//     [2]       ending: false,
//     [2]       ended: false,
//     [2]       finished: false,
//     [2]       destroyed: false,
//     [2]       decodeStrings: true,
//     [2]       defaultEncoding: 'utf8',
//     [2]       length: 0,
//     [2]       writing: false,
//     [2]       corked: 0,
//     [2]       sync: true,
//     [2]       bufferProcessing: false,
//     [2]       onwrite: [Function: bound onwrite],
//     [2]       writecb: null,
//     [2]       writelen: 0,
//     [2]       afterWriteTickInfo: null,
//     [2]       buffered: [],
//     [2]       bufferedIndex: 0,
//     [2]       allBuffers: true,
//     [2]       allNoop: true,
//     [2]       pendingcb: 0,
//     [2]       prefinished: false,
//     [2]       errorEmitted: false,
//     [2]       emitClose: true,
//     [2]       autoDestroy: true,
//     [2]       errored: null,
//     [2]       closed: false
//     [2]     },
//     [2]     _events: [Object: null prototype] {
//     [2]       conclude: [Function: receiverOnConclude],
//     [2]       drain: [Function: receiverOnDrain],
//     [2]       error: [Function: receiverOnError],
//     [2]       message: [Function: receiverOnMessage],
//     [2]       ping: [Function: receiverOnPing],
//     [2]       pong: [Function: receiverOnPong]
//     [2]     },
//     [2]     _eventsCount: 6,
//     [2]     _maxListeners: undefined,
//     [2]     _binaryType: 'nodebuffer',
//     [2]     _extensions: {},
//     [2]     _isServer: true,
//     [2]     _maxPayload: 104857600,
//     [2]     _skipUTF8Validation: false,
//     [2]     _bufferedBytes: 0,
//     [2]     _buffers: [],
//     [2]     _compressed: false,
//     [2]     _payloadLength: 0,
//     [2]     _mask: undefined,
//     [2]     _fragmented: 0,
//     [2]     _masked: false,
//     [2]     _fin: false,
//     [2]     _opcode: 0,
//     [2]     _totalPayloadLength: 0,
//     [2]     _messageLength: 0,
//     [2]     _fragments: [],
//     [2]     _state: 0,
//     [2]     _loop: false,
//     [2]     [Symbol(kCapture)]: false,
//     [2]     [Symbol(websocket)]: [Circular *1]
//     [2]   },
//     [2]   _sender: Sender {
//     [2]     _extensions: {},
//     [2]     _socket: Socket {
//     [2]       connecting: false,
//     [2]       _hadError: false,
//     [2]       _parent: null,
//     [2]       _host: null,
//     [2]       _readableState: [ReadableState],
//     [2]       _events: [Object: null prototype],
//     [2]       _eventsCount: 4,
//     [2]       _maxListeners: undefined,
//     [2]       _writableState: [WritableState],
//     [2]       allowHalfOpen: true,
//     [2]       _sockname: null,
//     [2]       _pendingData: null,
//     [2]       _pendingEncoding: '',
//     [2]       server: [Server],
//     [2]       _server: [Server],
//     [2]       parser: null,
//     [2]       on: [Function (anonymous)],
//     [2]       addListener: [Function (anonymous)],
//     [2]       prependListener: [Function: prependListener],
//     [2]       _paused: false,
//     [2]       timeout: 0,
//     [2]       [Symbol(async_id_symbol)]: 37,
//     [2]       [Symbol(kHandle)]: [TCP],
//     [2]       [Symbol(kSetNoDelay)]: true,
//     [2]       [Symbol(lastWriteQueueSize)]: 0,
//     [2]       [Symbol(timeout)]: null,
//     [2]       [Symbol(kBuffer)]: null,
//     [2]       [Symbol(kBufferCb)]: null,
//     [2]       [Symbol(kBufferGen)]: null,
//     [2]       [Symbol(kCapture)]: false,
//     [2]       [Symbol(kBytesRead)]: 0,
//     [2]       [Symbol(kBytesWritten)]: 0,
//     [2]       [Symbol(RequestTimeout)]: undefined,
//     [2]       [Symbol(websocket)]: [Circular *1]
//     [2]     },
//     [2]     _firstFragment: true,
//     [2]     _compress: false,
//     [2]     _bufferedBytes: 0,
//     [2]     _deflating: false,
//     [2]     _queue: []
//     [2]   },
//     [2]   _socket: <ref *2> Socket {
//     [2]     connecting: false,
//     [2]     _hadError: false,
//     [2]     _parent: null,
//     [2]     _host: null,
//     [2]     _readableState: ReadableState {
//     [2]       objectMode: false,
//     [2]       highWaterMark: 16384,
//     [2]       buffer: BufferList { head: null, tail: null, length: 0 },
//     [2]       length: 0,
//     [2]       pipes: [],
//     [2]       flowing: true,
//     [2]       ended: false,
//     [2]       endEmitted: false,
//     [2]       reading: true,
//     [2]       sync: false,
//     [2]       needReadable: true,
//     [2]       emittedReadable: false,
//     [2]       readableListening: false,
//     [2]       resumeScheduled: false,
//     [2]       errorEmitted: false,
//     [2]       emitClose: false,
//     [2]       autoDestroy: false,
//     [2]       destroyed: false,
//     [2]       errored: null,
//     [2]       closed: false,
//     [2]       closeEmitted: false,
//     [2]       defaultEncoding: 'utf8',
//     [2]       awaitDrainWriters: null,
//     [2]       multiAwaitDrain: false,
//     [2]       readingMore: false,
//     [2]       decoder: null,
//     [2]       encoding: null,
//     [2]       [Symbol(kPaused)]: false
//     [2]     },
//     [2]     _events: [Object: null prototype] {
//     [2]       end: [Array],
//     [2]       close: [Function: socketOnClose],
//     [2]       data: [Function: socketOnData],
//     [2]       error: [Function: socketOnError]
//     [2]     },
//     [2]     _eventsCount: 4,
//     [2]     _maxListeners: undefined,
//     [2]     _writableState: WritableState {
//     [2]       objectMode: false,
//     [2]       highWaterMark: 16384,
//     [2]       finalCalled: false,
//     [2]       needDrain: false,
//     [2]       ending: false,
//     [2]       ended: false,
//     [2]       finished: false,
//     [2]       destroyed: false,
//     [2]       decodeStrings: false,
//     [2]       defaultEncoding: 'utf8',
//     [2]       length: 0,
//     [2]       writing: false,
//     [2]       corked: 0,
//     [2]       sync: false,
//     [2]       bufferProcessing: false,
//     [2]       onwrite: [Function: bound onwrite],
//     [2]       writecb: null,
//     [2]       writelen: 0,
//     [2]       afterWriteTickInfo: null,
//     [2]       buffered: [],
//     [2]       bufferedIndex: 0,
//     [2]       allBuffers: true,
//     [2]       allNoop: true,
//     [2]       pendingcb: 0,
//     [2]       prefinished: false,
//     [2]       errorEmitted: false,
//     [2]       emitClose: false,
//     [2]       autoDestroy: false,
//     [2]       errored: null,
//     [2]       closed: false,
//     [2]       closeEmitted: false
//     [2]     },
//     [2]     allowHalfOpen: true,
//     [2]     _sockname: null,
//     [2]     _pendingData: null,
//     [2]     _pendingEncoding: '',
//     [2]     server: Server {
//     [2]       maxHeaderSize: undefined,
//     [2]       insecureHTTPParser: undefined,
//     [2]       _events: [Object: null prototype],
//     [2]       _eventsCount: 3,
//     [2]       _maxListeners: undefined,
//     [2]       _connections: 3,
//     [2]       _handle: [TCP],
//     [2]       _usingWorkers: false,
//     [2]       _workers: [],
//     [2]       _unref: false,
//     [2]       allowHalfOpen: true,
//     [2]       pauseOnConnect: false,
//     [2]       httpAllowHalfOpen: false,
//     [2]       timeout: 0,
//     [2]       keepAliveTimeout: 5000,
//     [2]       maxHeadersCount: null,
//     [2]       headersTimeout: 60000,
//     [2]       requestTimeout: 0,
//     [2]       _connectionKey: '6::::8080',
//     [2]       [Symbol(IncomingMessage)]: [Function: IncomingMessage],
//     [2]       [Symbol(ServerResponse)]: [Function: ServerResponse],
//     [2]       [Symbol(kCapture)]: false,
//     [2]       [Symbol(async_id_symbol)]: 8
//     [2]     },
//     [2]     _server: Server {
//     [2]       maxHeaderSize: undefined,
//     [2]       insecureHTTPParser: undefined,
//     [2]       _events: [Object: null prototype],
//     [2]       _eventsCount: 3,
//     [2]       _maxListeners: undefined,
//     [2]       _connections: 3,
//     [2]       _handle: [TCP],
//     [2]       _usingWorkers: false,
//     [2]       _workers: [],
//     [2]       _unref: false,
//     [2]       allowHalfOpen: true,
//     [2]       pauseOnConnect: false,
//     [2]       httpAllowHalfOpen: false,
//     [2]       timeout: 0,
//     [2]       keepAliveTimeout: 5000,
//     [2]       maxHeadersCount: null,
//     [2]       headersTimeout: 60000,
//     [2]       requestTimeout: 0,
//     [2]       _connectionKey: '6::::8080',
//     [2]       [Symbol(IncomingMessage)]: [Function: IncomingMessage],
//     [2]       [Symbol(ServerResponse)]: [Function: ServerResponse],
//     [2]       [Symbol(kCapture)]: false,
//     [2]       [Symbol(async_id_symbol)]: 8
//     [2]     },
//     [2]     parser: null,
//     [2]     on: [Function (anonymous)],
//     [2]     addListener: [Function (anonymous)],
//     [2]     prependListener: [Function: prependListener],
//     [2]     _paused: false,
//     [2]     timeout: 0,
//     [2]     [Symbol(async_id_symbol)]: 37,
//     [2]     [Symbol(kHandle)]: TCP {
//     [2]       reading: true,
//     [2]       onconnection: null,
//     [2]       _consumed: true,
//     [2]       [Symbol(owner_symbol)]: [Circular *2]
//     [2]     },
//     [2]     [Symbol(kSetNoDelay)]: true,
//     [2]     [Symbol(lastWriteQueueSize)]: 0,
//     [2]     [Symbol(timeout)]: null,
//     [2]     [Symbol(kBuffer)]: null,
//     [2]     [Symbol(kBufferCb)]: null,
//     [2]     [Symbol(kBufferGen)]: null,
//     [2]     [Symbol(kCapture)]: false,
//     [2]     [Symbol(kBytesRead)]: 0,
//     [2]     [Symbol(kBytesWritten)]: 0,
//     [2]     [Symbol(RequestTimeout)]: undefined,
//     [2]     [Symbol(websocket)]: [Circular *1]
//     [2]   },
//     [2]   _isServer: true,
//     [2]   [Symbol(kCapture)]: false
//     [2] }
