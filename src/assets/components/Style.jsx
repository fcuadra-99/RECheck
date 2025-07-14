const Style = (style) => {
    const styles = {
        input1: "font-sans font-thin block rounded-mg py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 border-gray-300 appearance-none  dark:border-gray-600 dark:focus:border-pink-600 focus:outline-none focus:ring-0 focus:border-blue-600 peer",
        label1: "font-sans font-medium peer-focus:font-medium absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-pink-600  peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-7.5",
        space1: "relative z-0 w-full mb-5.5 group",
        btn1: "font-sans text-white bg-pink-600 hover:bg-pink-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center my-3"
    }

    return styles[style] || style;
};

export default Style;