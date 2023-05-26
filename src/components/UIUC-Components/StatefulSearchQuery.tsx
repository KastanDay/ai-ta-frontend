import { createContext, useContext } from "react";

interface ChatContextData {
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
}

const SearchQuery = createContext<ChatContextData>({
  searchQuery: "",
  setSearchQuery: () => {}, // ignore: @typescript-eslint/no-empty-function
});

export const useChatContext = () => useContext(SearchQuery);

export default SearchQuery;