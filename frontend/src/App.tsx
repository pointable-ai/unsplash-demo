import { useState, useCallback, useRef } from "react";

import {
  Box,
  Button,
  Card,
  CardBody,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Flex,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  useDisclosure,
  Stack,
  Skeleton,
  Spinner,
  Text,
  Textarea,
  Wrap,
  ButtonGroup,
} from "@chakra-ui/react";

import { InView } from "react-intersection-observer";

import { SettingsIcon } from "@chakra-ui/icons";

export interface SearchQuery {
  starpoint_api_key: string;
  starpoint_collection_name: string;
  query_to_embed?: string;
  sql?: string;
}

export interface QueryResponse {
  collection_id: string;
  result_count: number;
  sql?: string | undefined | null;
  results: {
    __id: string;
    __distance?: number;
    [key: string]: string | number | undefined | null;
  }[];
}

async function search(data: SearchQuery): Promise<QueryResponse> {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/search`, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(data),
  });
  return response.json() as Promise<QueryResponse>;
}

interface Config {
  apiKey: string;
  collectionName: string;
}

interface SettingsProps {
  config: React.MutableRefObject<Config>;
}

const API_KEY_KEY = "api_key";
const COLLECTION_NAME_KEY = "collection_name";

const Settings = (props: SettingsProps) => {
  const { config } = props;
  const [collectionName, setCollectionName] = useState(
    config.current.collectionName
  );
  const [apiKey, setApiKey] = useState(config.current.apiKey);
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);

  const isError = {
    api: apiKey.length === 0,
    collectionName: collectionName.length === 0,
  };

  return (
    <Flex direction="column">
      <Heading>Settings</Heading>
      <FormControl isRequired isInvalid={isError.api || isError.collectionName}>
        <Stack spacing={2}>
          <Box>
            <FormLabel>API Key</FormLabel>
            <InputGroup size="md">
              <Input
                isInvalid={isError.api}
                type={show ? "text" : "password"}
                placeholder="API Key"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  config.current.apiKey = e.target.value;
                  localStorage.setItem(API_KEY_KEY, e.target.value);
                }}
              />
              <InputRightElement width="4.5rem">
                <Button h="1.75rem" size="sm" onClick={handleClick}>
                  {show ? "Hide" : "Show"}
                </Button>
              </InputRightElement>
            </InputGroup>
            {isError.api && (
              <FormErrorMessage>API Key is required</FormErrorMessage>
            )}
          </Box>
          <Box>
            <FormLabel>Collection Name</FormLabel>
            <Input
              isInvalid={isError.collectionName}
              type="text"
              value={collectionName}
              onChange={(e) => {
                setCollectionName(e.target.value);
                config.current.collectionName = e.target.value;
                localStorage.setItem(COLLECTION_NAME_KEY, e.target.value);
              }}
            />

            {isError.collectionName && (
              <FormErrorMessage>Collection Name is required</FormErrorMessage>
            )}
          </Box>
        </Stack>
      </FormControl>
    </Flex>
  );
};

interface ImageCardProps {
  photoId: string;
  photoUrl: string;
  description: string;
  extra: string;
}

const ImageCard = (props: ImageCardProps) => {
  const { description, photoId, photoUrl, extra } = props;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loadArt, setLoadArt] = useState(false);
  return (
    <>
      <Card width="360px">
        <CardBody>
          <InView onChange={(inView) => setLoadArt(inView)} triggerOnce>
            {loadArt && (
              <Image
                rounded="1rem"
                onClick={onOpen}
                boxSize="360px"
                objectFit="cover"
                src={photoUrl}
                fallback={<Skeleton height="360px" />}
              />
            )}
          </InView>
        </CardBody>
        <CardBody paddingTop={0}>
          <Heading size="md">{photoId}</Heading>
          <Text>{description}</Text>
          <Textarea value={extra} readOnly height={300} />
        </CardBody>
      </Card>
      <Modal size="xl" onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay>
          <ModalContent>
            <Image onClick={onOpen} src={photoUrl} fallback={<Skeleton />} />
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </>
  );
};

const App = () => {
  const config = useRef<Config>({
    apiKey: localStorage.getItem(API_KEY_KEY) ?? "",
    collectionName: localStorage.getItem(COLLECTION_NAME_KEY) ?? "",
  });
  const [query, setQuery] = useState<string>("");
  const [sql, setSql] = useState<string>("");
  const [results, setResults] = useState<QueryResponse["results"]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const triggerSearch = useCallback(async () => {
    if (!config.current.apiKey || !config.current.collectionName) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await search({
        starpoint_api_key: config.current.apiKey,
        starpoint_collection_name: config.current.collectionName,
        query_to_embed: query,
        sql,
      });
      setResults(response.results);
    } catch (e) {
      let err = e as Error;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, sql]);

  return (
    <Box padding={4}>
      <Heading>
        Welcome to Starpoint's Natural Language Image Search Demo!
      </Heading>

      <FormControl>
        <Stack padding={2}>
          <InputGroup>
            <FormLabel width={300}>Natural Language Search</FormLabel>
            <Textarea
              placeholder="A road in the forest..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>

          <InputGroup>
            <FormLabel width={100}>SQL Filter</FormLabel>
            <Textarea
              placeholder="SELECT * FROM collection WHERE..."
              value={sql}
              onChange={(e) => setSql(e.target.value)}
            />
          </InputGroup>
          <ButtonGroup>
            <IconButton aria-label="settings" onClick={onOpen}>
              <SettingsIcon />
            </IconButton>

            <Button
              disabled={
                loading ||
                !config.current.apiKey ||
                !config.current.collectionName
              }
              onClick={triggerSearch}
            >
              Search
            </Button>
          </ButtonGroup>
        </Stack>
      </FormControl>
      <Box>
        {loading && <Spinner />}
        {error && <div>{error}</div>}
        { results !== undefined && (
          <Wrap spacing="1rem" padding="1rem" justify="center">
            {results.map((result) => {
              const WIDTH = 320;
              const photoId = result["photo_id"] as string;
              const photoUrl = `https://unsplash.com/photos/${photoId}/download?w=${WIDTH}`;
              const description = result["ai_description"] as string;
              return (
                <ImageCard
                  key={photoId}
                  photoId={photoId}
                  photoUrl={photoUrl}
                  description={description}
                  extra={JSON.stringify(result, null, 4)}
                />
              );
            })}
          </Wrap>
        )}
      </Box>
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody>
            <Settings config={config} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default App;
