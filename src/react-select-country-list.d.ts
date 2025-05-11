declare module "react-select-country-list" {
    interface CountryOption {
        label: string;
        value: string;
    }

    function useCountryList(p: { locale: string }): { getData: () => CountryOption[] };

    export default useCountryList;
}
