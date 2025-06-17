// seedPhotographers.js - Script to insert sample data
const mongoose = require('mongoose');
const Photographer = require('./models/Photographer');

const samplePhotographers = [
    {
        email: "alex.johnson@example.com",
        password: "hashedPassword123", // Remember to hash passwords in real implementation
        name: "Alex Johnson",
        phone: "+91-9876543210",
        specialization: "Wedding & Portrait",
        location: "Mumbai, Maharashtra",
        city: "Mumbai",
        state: "Maharashtra",
        priceRange: {
            min: 5000,
            max: 15000
        },
        profileImage: "https://via.placeholder.com/150",
        portfolio: [
            "https://media.istockphoto.com/id/1419410282/photo/silent-forest-in-spring-with-beautiful-bright-sun-rays.jpg?s=612x612&w=0&k=20&c=UHeb1pGOw6ozr6utsenXHhV19vW6oiPIxDqhKCS2Llk=",
            
        ],
        about: "Professional photographer with 8+ years of experience in wedding and portrait photography. Passionate about capturing life's precious moments.",
        yearsOfExperience: 8,
        verified: true,
        totalShoots: 342,
        services: ["Wedding Photography", "Portrait Session", "Pre-Wedding Shoot"],
        equipment: ["Canon EOS R5", "Sony A7R IV", "Professional Lighting Kit"],
        reviews: [
            {
                userName: "Priya Sharma",
                rating: 5,
                comment: "Absolutely amazing work! Alex captured our wedding beautifully.",
                date: new Date("2024-12-15")
            },
            {
                userName: "Rahul Gupta",
                rating: 4,
                comment: "Great photographer, very professional and creative.",
                date: new Date("2024-11-28")
            }
        ],
        socialMedia: {
            instagram: "@alexjohnsonphotography",
            website: "www.alexjohnsonphoto.com"
        }
    },
    {
        email: "sarah.williams@example.com",
        password: "hashedPassword456",
        name: "Sarah Williams",
        phone: "+91-9876543211",
        specialization: "Fashion & Commercial",
        location: "Delhi, India",
        city: "Delhi",
        state: "Delhi",
        priceRange: {
            min: 8000,
            max: 25000
        },
        profileImage: "https://via.placeholder.com/150",
        portfolio: [
            "https://media.istockphoto.com/id/1419410282/photo/silent-forest-in-spring-with-beautiful-bright-sun-rays.jpg?s=612x612&w=0&k=20&c=UHeb1pGOw6ozr6utsenXHhV19vW6oiPIxDqhKCS2Llk=",
        ],
        about: "Award-winning fashion photographer specializing in commercial and editorial shoots. Featured in multiple fashion magazines.",
        yearsOfExperience: 12,
        verified: true,
        totalShoots: 428,
        services: ["Fashion Shoot", "Product Photography", "Corporate Events"],
        equipment: ["Hasselblad X1D", "Profoto Lighting", "Medium Format Lenses"],
        reviews: [
            {
                userName: "Anita Desai",
                rating: 5,
                comment: "Sarah's fashion photography is outstanding! Highly recommended.",
                date: new Date("2024-12-10")
            }
        ],
        socialMedia: {
            instagram: "@sarahwilliamsfashion",
            website: "www.sarahwilliamsphoto.com"
        }
    }
];

// Function to seed the database
async function seedDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/D_Services');
        
        // Clear existing data (optional)
        await Photographer.deleteMany({});
        
        // Insert sample data
        await Photographer.insertMany(samplePhotographers);
        
        console.log('Sample photographers inserted successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase();
