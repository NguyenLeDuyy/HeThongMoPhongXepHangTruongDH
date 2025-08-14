import Image from "next/image";

export default function ProfileCard() {
    return (
        <div className="flex flex-col items-center justify-center max-w-md p-6 bg-white rounded-lg shadow-md gap-4 text-center">
            <Image src="/avatar.png" alt="user" width="50" height="50" className="rounded-full" />
            <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold">John Doe</h2>
                <p className="text-gray-500">Software Engineer</p>
            </div>
            <div className="flex gap-2">
                <div className="flex flex-col items-center px-4">
                    <span className="text-lg font-semibold">120</span>
                    <span className="text-gray-500">Posts</span>
                </div>
                <div className="flex flex-col items-center px-4">
                    <span className="text-lg font-semibold">80k</span>
                    <span className="text-gray-500">Following</span>
                </div>
                <div className="flex flex-col items-center px-4">
                    <span className="text-lg font-semibold">1.2K</span>
                    <span className="text-gray-500">Following</span>
                </div>
            </div>
            <p className="text-gray-500">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Harum animi beatae molestiae quasi fugiat ut.
            </p>
            <button className="bg-purple-400 text-white px-6 py-3 rounded-full hover:bg-purple-500 transition duration-300 active:scale-95">
                View Profile
            </button>
        </div>
    );
}