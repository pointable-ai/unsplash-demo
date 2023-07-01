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
  Badge,
} from "@chakra-ui/react";
import { InView } from "react-intersection-observer";
import { SettingsIcon } from "@chakra-ui/icons";

import { SqlEditor } from "./components/SqlEditor";

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
  const handleClick = () => setShow((value) => !value);

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
  photoUrl: string;
  photoId: string;
  description: string;
  extra: string;
  showInfo?: boolean;
}

const ImageCard = (props: ImageCardProps) => {
  const { description, photoId, photoUrl, extra, showInfo } = props;
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
        {showInfo && (
          <CardBody paddingTop={0}>
            <Heading size="md">{photoId}</Heading>
            <Text>{description}</Text>
            <Textarea value={extra} readOnly height={300} />
          </CardBody>
        )}
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
  const { isOpen, onOpen, onClose } = useDisclosure({
    defaultIsOpen:
      config.current.apiKey === undefined ||
      config.current.apiKey === "" ||
      config.current.collectionName === undefined ||
      config.current.collectionName === "",
  });
  const {
    isOpen: isSchemaOpen,
    onOpen: onSchemaOpen,
    onClose: onSchemaClose,
  } = useDisclosure();

  const [showInfo, setShowInfo] = useState(false);
  const toggleShowInfo = () => setShowInfo((value) => !value);

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

      <FormControl width="100%">
        <Stack padding={2} width="100%">
          <InputGroup flexDirection="column" my={2}>
            <FormLabel width={300}>Natural Language Query</FormLabel>
            <Textarea
              placeholder="A road in the forest..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
          <InputGroup flexDirection="column" my={2}>
            <SqlEditor query={sql} onChange={(v) => setSql(v)} />
          </InputGroup>
          <ButtonGroup>
            <IconButton aria-label="settings" onClick={onOpen}>
              <SettingsIcon />
            </IconButton>
            <Button onClick={toggleShowInfo}>
              {showInfo ? "Hide Image Info" : "Show Image Info"}
            </Button>
            <Button onClick={onSchemaOpen}>View Schema</Button>
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
        {results !== undefined && (
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
                  showInfo={showInfo}
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
      <Drawer placement="right" onClose={onSchemaClose} isOpen={isSchemaOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerBody>
            <Heading>Schema</Heading>
            {Object.keys(SCHEMA.inferred_schema.types).map((key) => (
              <div>
                <Badge key={key}>{key}</Badge>
              </div>
            ))}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default App;

const SCHEMA = {
  inferred_schema: {
    nullability: {
      __id: false,
      ai_description: false,
      ai_primary_landmark_confidence: true,
      ai_primary_landmark_latitude: true,
      ai_primary_landmark_longitude: true,
      ai_primary_landmark_name: true,
      blur_hash: false,
      exif_aperture_value: false,
      exif_camera_make: false,
      exif_camera_model: false,
      exif_exposure_time: false,
      exif_focal_length: false,
      exif_iso: false,
      photo_aspect_ratio: false,
      photo_description: true,
      photo_featured: false,
      photo_height: false,
      photo_id: false,
      photo_image_url: false,
      photo_location_city: true,
      photo_location_country: true,
      photo_location_latitude: true,
      photo_location_longitude: true,
      photo_location_name: true,
      photo_submitted_at: false,
      photo_url: false,
      photo_width: false,
      photographer_first_name: false,
      photographer_last_name: true,
      photographer_username: false,
      stats_downloads: false,
      stats_views: false,
    },
    types: {
      __id: ["String"],
      ai_description: ["String"],
      ai_primary_landmark_confidence: [],
      ai_primary_landmark_latitude: [],
      ai_primary_landmark_longitude: [],
      ai_primary_landmark_name: [],
      blur_hash: ["String"],
      exif_aperture_value: ["String"],
      exif_camera_make: ["String"],
      exif_camera_model: ["String"],
      exif_exposure_time: ["String"],
      exif_focal_length: ["String"],
      exif_iso: ["Number"],
      photo_aspect_ratio: ["Number"],
      photo_description: ["String"],
      photo_featured: ["String"],
      photo_height: ["Number"],
      photo_id: ["String"],
      photo_image_url: ["String"],
      photo_location_city: [],
      photo_location_country: [],
      photo_location_latitude: [],
      photo_location_longitude: [],
      photo_location_name: [],
      photo_submitted_at: ["String"],
      photo_url: ["String"],
      photo_width: ["Number"],
      photographer_first_name: ["String"],
      photographer_last_name: ["String"],
      photographer_username: ["String"],
      stats_downloads: ["Number"],
      stats_views: ["Number"],
    },
  },
} as const;
