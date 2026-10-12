function App() {

    return (
        <div
            className="mx-auto flex max-w-sm items-center gap-x-4 rounded-xl bg-white p-6 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
            <div>
                <div className="text-xl font-medium text-black dark:text-white">ChitChat</div>
                <p className="text-gray-500 dark:text-gray-400">You have a new message!</p>
            </div>
            <h1 className="text-xs font-bold">
                Hello world!
            </h1>
            <button className="bg-sky-700 px-4 py-2 text-white hover:bg-sky-800 sm:px-8 sm:py-3">Submit</button>
        </div>

    )
}

export default App
