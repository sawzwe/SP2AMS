import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET - Fetch all rooms with their status details and the latest payment status
const getRooms = async (req, res) => {
    try {
        const getrooms = await prisma.roomBaseDetails.findMany({
            include: {
                statusDetails: true,
                generatedBillRecords: {
                    orderBy: {
                        generation_date: 'desc', // Order by generation_date to get the latest bill
                    },
                    take: 1, // Take only the latest bill for each room
                    select: {
                        payment_status: true, // Select only the payment_status field
                    },
                },
            },
        });
        res.status(200).json({ message: 'Get all rooms successfully', getrooms });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET - Fetch one room with their status and rates details
const getEachRoom = async (req, res) => {
    const { room_id } = req.params;
    try {
        const room = await prisma.roomBaseDetails.findUnique({
            where: { room_id: parseInt(room_id) },
            include: {
                statusDetails: true,
                room_rates: {
                    include: {
                        rates: true, // Include the rates details associated with each room_rate
                    },
                },
            },
        });

        if (!room) {
            // Handle the case where the room with the specified room_id is not found
            res.status(404).json({ message: 'Room not found' });
        } else {
            res.status(200).json({ message: 'Get room successfully', room });
        }
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ error: error.message });
    }
};


// POST - Create a new room with rates
const createRoom = async (req, res) => {
    const { room_number, floor, room_type, base_rent, deposit, statusDetails, rates } = req.body;

    try {
        const newRoom = await prisma.roomBaseDetails.create({
            data: {
                room_number,
                floor,
                room_type,
                base_rent,
                deposit,
                statusDetails: {
                    create: statusDetails,
                },
                // Adjust here to read rate_id and quantity from each rate object
                room_rates: {
                    create: rates.map(({ rate_id, quantity }) => ({
                        rate_id,
                        quantity, // Use the quantity from the request
                    })),
                },
            },
            include: {
                statusDetails: true,
                room_rates: {
                    include: {
                        rates: true,
                    },
                },
            },
        });
        res.status(200).json({ message: 'Added a new room successfully', newRoom });
    } catch (error) {
        console.error('Error creating new room with rates:', error);
        res.status(500).json({ error: error.message });
    }
};


// // PUT - Update a room's details

// const updateRoom = async (req, res) => {
//     const { room_id } = req.params;
//     const { room_number, floor, room_type, base_rent, deposit, statusDetails, rates } = req.body;

//     try {
//         // Begin a transaction to ensure atomicity
//         const updatedRoom = await prisma.$transaction(async (prisma) => {
//             // First, update the basic details of the room
//             const roomUpdate = await prisma.roomBaseDetails.update({
//                 where: { room_id: parseInt(room_id) },
//                 data: {
//                     room_number,
//                     floor,
//                     room_type,
//                     base_rent,
//                     deposit,
//                     statusDetails: {
//                         update: statusDetails,
//                     },
//                 },
//                 include: {
//                     statusDetails: true,
//                     room_rates: true,
//                 },
//             });

//             // Handle each rate update, creation, or deletion
//             const ratePromises = rates.map(async ({ rate_id, quantity, disabled }) => {
//                 // Check if the rate should be removed (quantity is 0 or disabled is true)
//                 if (quantity === 0 || disabled) {
//                     return prisma.room_rates.deleteMany({
//                         where: {
//                             room_id: parseInt(room_id),
//                             rate_id,
//                         },
//                     });
//                 } else {
//                     // Otherwise, upsert the rate
//                     return prisma.room_rates.upsert({
//                         where: {
//                             room_id_rate_id: {
//                                 room_id: parseInt(room_id),
//                                 rate_id,
//                             },
//                         },
//                         update: {
//                             quantity,
//                         },
//                         create: {
//                             room_id: parseInt(room_id),
//                             rate_id,
//                             quantity,
//                         },
//                     });
//                 }
//             });

//             await Promise.all(ratePromises);

//             return roomUpdate; // Return the updated room details
//         });

//         res.status(200).json({ message: 'Room updated successfully', data: updatedRoom });
//     } catch (error) {
//         console.error('Error updating room:', error);
//         res.status(500).json({ error: error.message });
//     }
// };

const updateRoom = async (req, res) => {
    const { room_id } = req.params;
    const { room_number, floor, room_type, base_rent, deposit, statusDetails, rates } = req.body;

    try {
        // Begin a transaction to ensure atomicity
        const updatedRoom = await prisma.$transaction(async (prisma) => {
            // First, update the basic details of the room
            const roomUpdate = await prisma.roomBaseDetails.update({
                where: { room_id: parseInt(room_id) },
                data: {
                    room_number,
                    floor,
                    room_type,
                    base_rent,
                    deposit,
                    statusDetails: {
                        update: statusDetails,
                    },
                },
                include: {
                    statusDetails: true,
                    room_rates: true,
                },
            });

            // Handle each rate update, creation, or deletion
            const ratePromises = rates.map(async ({ rate_id, quantity, disabled }) => {
                // Check if the rate should be removed (quantity is 0 or disabled is true)
                if (quantity === 0 || disabled) {
                    return prisma.room_rates.deleteMany({
                        where: {
                            room_id: parseInt(room_id),
                            rate_id,
                        },
                    });
                } else {
                    // Otherwise, upsert the rate
                    return prisma.room_rates.upsert({
                        where: {
                            room_id_rate_id: {
                                room_id: parseInt(room_id),
                                rate_id,
                            },
                        },
                        update: {
                            quantity,
                        },
                        create: {
                            room_id: parseInt(room_id),
                            rate_id,
                            quantity,
                        },
                    });
                }
            });

            await Promise.all(ratePromises);

            return roomUpdate; // Return the updated room details
        });

        res.status(200).json({ message: 'Room updated successfully', data: updatedRoom });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ error: error.message });
    }
};



// DELETE - Remove a room

const deleteRoom = async (req, res) => {
    const { room_id } = req.params;

    try {
        // Start a transaction to ensure data consistency
        await prisma.$transaction(async (prisma) => {
            // Delete related tenancy records
            await prisma.tenancy_records.deleteMany({
                where: { room_id: parseInt(room_id) },
            });

            // Delete the room
            await prisma.roomBaseDetails.delete({
                where: { room_id: parseInt(room_id) },
            });
        });

        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: error.message });
    }
};


export { getRooms, createRoom, updateRoom, deleteRoom,getEachRoom };
