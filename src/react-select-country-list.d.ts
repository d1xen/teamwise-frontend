declare module "react-select-country-list" {
    interface CountryOption {
        label: string;
        value: string;
    }

    function useCountryList(): {
        getData: () => CountryOption[];
    };

    export default useCountryList;
}
