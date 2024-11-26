--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: app_data; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA app_data;


ALTER SCHEMA app_data OWNER TO admin;

--
-- Name: system_stats; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS system_stats WITH SCHEMA public;


--
-- Name: EXTENSION system_stats; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION system_stats IS 'EnterpriseDB system statistics for PostgreSQL';


--
-- Name: update_timestamp(); Type: FUNCTION; Schema: app_data; Owner: admin
--

CREATE FUNCTION app_data.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION app_data.update_timestamp() OWNER TO admin;

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: app_data; Owner: admin
--

CREATE TABLE app_data.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action character varying(255) NOT NULL,
    ip_address character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE app_data.audit_logs OWNER TO admin;

--
-- Name: credentials; Type: TABLE; Schema: app_data; Owner: admin
--

CREATE TABLE app_data.credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    site_url character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    password text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(100),
    note character varying(255),
    name_iv text,
    url_iv text NOT NULL,
    username_iv text NOT NULL,
    password_iv text NOT NULL,
    note_iv text
);


ALTER TABLE app_data.credentials OWNER TO admin;

--
-- Name: oauth_tokens; Type: TABLE; Schema: app_data; Owner: admin
--

CREATE TABLE app_data.oauth_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamp without time zone NOT NULL,
    provider character varying(50) NOT NULL
);


ALTER TABLE app_data.oauth_tokens OWNER TO admin;

--
-- Name: password_breach; Type: TABLE; Schema: app_data; Owner: admin
--

CREATE TABLE app_data.password_breach (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    password_id uuid,
    breached_site character varying(255) NOT NULL,
    password_found_in_breach boolean DEFAULT false,
    breach_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE app_data.password_breach OWNER TO admin;

--
-- Name: password_history; Type: TABLE; Schema: app_data; Owner: admin
--

CREATE TABLE app_data.password_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    password_id uuid,
    previous_password text NOT NULL,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE app_data.password_history OWNER TO admin;

--
-- Name: sessions; Type: TABLE; Schema: app_data; Owner: admin
--

CREATE TABLE app_data.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    session_token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE app_data.sessions OWNER TO admin;

--
-- Name: two_factor_auth; Type: TABLE; Schema: app_data; Owner: admin
--

CREATE TABLE app_data.two_factor_auth (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    otp_secret text NOT NULL,
    enabled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_used_at timestamp without time zone
);


ALTER TABLE app_data.two_factor_auth OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: app_data; Owner: admin
--

CREATE TABLE app_data.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(512) NOT NULL,
    password_hash character varying(512) NOT NULL,
    two_factor_enabled boolean DEFAULT false,
    google_oauth_id character varying(512),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone,
    master_password_hash text,
    master_password_salt text,
    username character varying(512),
    email_iv character varying(32),
    username_iv character varying(32),
    google_oauth_id_iv character varying(32),
    reset_token_hash character varying(512),
    reset_token_expires timestamp with time zone
);


ALTER TABLE app_data.users OWNER TO admin;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action character varying(255) NOT NULL,
    ip_address character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO admin;

--
-- Name: oauth_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.oauth_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamp without time zone NOT NULL,
    provider character varying(50) NOT NULL
);


ALTER TABLE public.oauth_tokens OWNER TO admin;

--
-- Name: password_breach; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.password_breach (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    password_id uuid,
    breached_site character varying(255) NOT NULL,
    password_found_in_breach boolean DEFAULT false,
    breach_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_breach OWNER TO admin;

--
-- Name: password_history; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.password_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    password_id uuid,
    previous_password text NOT NULL,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.password_history OWNER TO admin;

--
-- Name: passwords; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.passwords (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    site_name character varying(255) NOT NULL,
    url character varying(255),
    username character varying(255),
    encrypted_password text NOT NULL,
    password_salt text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.passwords OWNER TO admin;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    session_token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sessions OWNER TO admin;

--
-- Name: two_factor_auth; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.two_factor_auth (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    otp_secret text NOT NULL,
    enabled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_used_at timestamp without time zone
);


ALTER TABLE public.two_factor_auth OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    two_factor_enabled boolean DEFAULT false,
    google_oauth_id character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO admin;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: app_data; Owner: admin
--

COPY app_data.audit_logs (id, user_id, action, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: credentials; Type: TABLE DATA; Schema: app_data; Owner: admin
--

COPY app_data.credentials (id, user_id, site_url, username, password, created_at, updated_at, name, note, name_iv, url_iv, username_iv, password_iv, note_iv) FROM stdin;
80ca149f-7062-486c-af15-1656be7849ca	4d29e43d-4484-49a4-baf3-9ab988f17301	9b63f9ee3f83b5b0c8a50eb1e981603416c9aeffe76ee4b2cde63498fda19f6a7299bc72db334d1bea364db05cc0020e6660d35455cbeb90238119d987a2aee9	69f4c43e519f0ebcca0e3ce155198904b402ccc1afc167b1197ae9e82ac3713b	1f2edfa9a32861995c6729edbd6f43f5	2024-11-22 23:43:45.803+03	2024-11-22 23:43:45.803+03	451eba243f5e9537c0ff2b4bacd647e547fd7f9a3b44623d7a1f89671a603e5e	\N	a4f353b84716d3dfb9a5f238f5591c62	6c85300e2b9ce704c470859f38ee75b8	7ce2cdbd67218386a03d25d9df48aa73	a195d4d80f2625725605bf7750b362fa	\N
e804d857-057e-4f6a-8aa9-3460e55451e0	4d29e43d-4484-49a4-baf3-9ab988f17301	63e02ceb20ca3d49a643f8c4bca058e19d80e54f3c22157565c72d311f0191cd	60c95928ad8df953f193494e5fd567f75dbafb08db8cfa68aecd0c957c6917e1	a87ffbdb51e40d8b4e682f35273bb6a635306dc0fd4396417675bdf3af1909d4	2024-11-22 23:43:45.804+03	2024-11-22 23:43:45.804+03	f5ac1c87c6398eee298c433e0b406b2d	\N	76bb903273baa455d9c7f916a1b603fe	70105d42d5cbd2f7dc48ba7f0d9fffea	fa490a649b62e9ee999fc031e9405eab	af7eaec9fc1d8f22e0748bc0f35af6ca	\N
eb3e9c23-f0a8-4516-95fb-316c88c3faf6	4d29e43d-4484-49a4-baf3-9ab988f17301	87e02f4f8d234a9aeb12fc7327259089312ca97a360067e0b4d6ee65694c5d7a	e876131e2520921f7d96eb3c98f4477c	64ec3ef2b6f3f8fec0af5f5c59850a96	2024-11-22 23:43:45.804+03	2024-11-22 23:43:45.805+03	355005b6b4de87524c025148bf959ba5	\N	6d6cba4c049c1a70ad11a106983af29e	4e057df27f9ce2dd3a7709e6c31395be	3e28bd583c3a08274716e3b92e251faa	2eefa02afd5feb4f3789a466b4296eb7	\N
107e6950-b684-4c76-ae09-479c24dc0451	f2007df3-cb4e-4b9f-bc64-ccce28d0a90d	cec1e2570e88f9b0674ab7cb8c3634c615733e344f70cdb178f8105cb6269bb4	1d02688097e5ab71f2b576848fb02d93	7e4bb23d79bdfa9480c03d9058c6c475	2024-11-24 11:07:33.291+03	2024-11-24 11:07:33.285+03	\N	\N	\N	4696be6e08c0826734234487b809746d	e87f3ee80b2694064682009c777dc18a	2960408fe0fb1e4859e2f3a312bbbfbc	\N
55024253-b39d-4ed7-ad23-6ae4d567f670	f2007df3-cb4e-4b9f-bc64-ccce28d0a90d	e1780db7140708cfa4dcb5e335d451dd0fed2b72992a34907a26c5fbbc6d006c	fd7f80c04e06910b5631b572113ea23b	94f170679ffefdbd7ee1243083cda565	2024-11-24 11:37:26.425+03	2024-11-24 11:37:26.423+03	\N	\N	\N	397fea8aa67d3118ecda8fa6c2d3d4be	809955b8638c7e02ca7976a7696c2d4d	335ec5f85179677f0899829a91970d57	\N
b46de4e1-16ab-4297-b0e8-11c017c3263b	4d29e43d-4484-49a4-baf3-9ab988f17301	65a008bb0c32e9dd8127be2e7772d507b4017d3e9c05694c2184eb4623d13a19	fe6d0eef5745541c901451b86f98bd29	a82ed2f0b70af4fb438c30f6b691e02b	2024-11-24 16:20:50.621+03	2024-11-24 16:20:50.616+03	\N	\N	\N	f795c23d0c409aca88eb7bb872fb902f	24cf7696cb01b1069dba359b57dd994c	43ae25709ef1ed49f0e549f9f92fe5ab	\N
6d08c6a8-2274-49a0-8fec-c83979cb7c33	4d29e43d-4484-49a4-baf3-9ab988f17301	967d4076bfc0cf28c5204b34c6076c6500e3708c05628bbb62bf9321d6accec3214b7363ee1fe6c5bf1dee14f9b4ecfbb70a04fbeb6c9e90f9981432f8a7cab8	27351df89a1e4021b47cdba696e13cdc28bcf4bf51ee6821895acfd6074425fa	88cd58c50aabe7a2318ae8ceca166d08	2024-11-24 16:51:30.945+03	2024-11-24 16:51:30.945+03	3e969546247e8c7002196f691aab921ea971080cb5e654e55a6dfc4e97ff4caf	\N	53bb2c86f68ec284d05031d6b2dfcd9f	b6dfe4512ccbe192bc0de2d3771600c4	72f342f06bdfcd9f411a88f7db53a618	0aedf120811a891a7b1bce9da0261e45	\N
133b2f02-63e0-4ef5-b5c6-b46176510e9c	4d29e43d-4484-49a4-baf3-9ab988f17301	44b5a6d94831094620d8b5f73227fad0f0aa77d5faf28ded27fa26226ff2e63f	632a9edb6d6a6933065abab458fa2ec598b021226b378d2c4315b21db464038c	47ed361fdb632804d0096bc79450c2048b20e2ef7c10b80a749dfc6651f17a81	2024-11-24 16:51:30.945+03	2024-11-24 16:51:30.945+03	7e63c4831346c414c24d1466a0aaf753	\N	fb18f64f9409f799f3be6a9f8542ca58	89e80ce7ad69a3da1b64b8e84e9c41a8	a727ea213f91a2771d1e7de08f3ebc9f	fdddb95f66a29895b1db47b1635584f1	\N
5837d53b-b585-4827-bffa-c755024f8baf	4d29e43d-4484-49a4-baf3-9ab988f17301	9f90a2ccbdb9fe81bafdfaf279b1a18ac18af9df23770ddd31bf9bf88b861fdd	4c8d598fc4a14940e9414ec7633e0065	edc750e008b6a2e3faca7417083fa94a	2024-11-24 16:51:30.946+03	2024-11-24 16:51:30.946+03	2d5945026e100c88caa90f8a6271199e	\N	a947c08b0bce34357c1d63d107db6717	03664357846354a184ba621db37fc5a6	e4fd1ccd699aa99c71c369795a9f475a	c86ae16559e620a0f42ad5aed221364c	\N
dc7c6bac-39e4-43a7-92cf-a9d9dcebba03	4d29e43d-4484-49a4-baf3-9ab988f17301	8114997bb2ff3f4d1cb3621b783fc08732023bfc73141bed6cd8ea375e5e741e	a332f0c721cf0666d9a53888258ec06b	1982c34135580f6c75cb8757b79c92bd	2024-11-24 17:44:10.955+03	2024-11-24 17:44:10.954+03	\N	\N	\N	391e6a779c797c797e52cd0e8e429c54	7890f52305758c93940b3ca65e347142	3b82cb3f649d1bc145d47f9fe710b8dc	\N
5f28966f-d3db-44b9-87b6-5b17d24bf59f	4d29e43d-4484-49a4-baf3-9ab988f17301	910f3a98055e4ed14fff46ada227f7b3e27eb41b95c9b16417162df234e6ccd0	cd3d5f2f727b9d7ff0c4265b9b230111	92c5b004744d5391581e99434e610528	2024-11-24 18:42:07.385+03	2024-11-24 18:42:07.384+03	\N	\N	\N	26b69f6c070dccebbd7897e393fe1acf	2595da95cc43551bfac9cbf9c22df49d	3a4824b7f0c4e100b3793e37a4126cfe	\N
89a9fd70-ea39-4d56-8c72-3b228fd6e0d1	4d29e43d-4484-49a4-baf3-9ab988f17301	3557755b8ff2b9902caa770c7ac6190eaa01febc08f7350e64c6a575038688c6	3a9ff6f368e485db91902593bc8b8a48	53be57d6e4ad803c509d08c7a38f0231	2024-11-24 23:19:01.831+03	2024-11-24 23:19:01.826+03	\N	\N	\N	3c5f9fb9a2716d3041310929cc59e5a1	31fd492ea802e38af707a39cfbf8a4e5	5a5856b610660b811117f1e3ef424cd0	\N
ee0d7171-a25c-416e-b30a-3006de7a5c3f	4d29e43d-4484-49a4-baf3-9ab988f17301	4e0cdcfb3940cc71be42e8331c42fe29dee922ac49e006bbe26d03c2f4223683	ca512172d476e74151cae699c1039c8c	65d70b880c9f113942cdbc85579b872d	2024-11-24 23:31:25.214+03	2024-11-24 23:31:25.213+03	\N	\N	\N	89d37675797f02ea32be2ca956a2c5ac	d3be955aa5587810070a06885fe1912b	16eb8c7e55d9c7c6bece84a2a8e9e2f1	\N
09632b3e-c4cf-49bf-98b1-40ab712195e3	f2007df3-cb4e-4b9f-bc64-ccce28d0a90d	9667396a906534c9dcd4a6c7a1667746ca723fd41cdfcc4e8cb0f5ae7f188cee	f7fae85b787f191641e381b608682fab	c34a4eafe10443064527eb96863ed1a7	2024-11-25 01:29:16.447+03	2024-11-25 01:29:16.446+03	\N	\N	\N	a165f032a39c6ad5f2e2ea8aa216a8e3	06b4a16f486940e6205d3562d65dbeec	137e3887271d1d6b0a483acafab5c1d3	\N
8d6ca3e8-84a7-40e0-bf93-c7063b3f9513	29d4affb-5939-4079-bf48-72d561f55e7f	de49e34c3ed4a663abd4fe492c834b110eafbfdff8ea63e9773a45e47b6eba93	2ad24b73304250067004db0d04a4ec145d8b7e76cf4c941decfecf231090c4a1	38fb6de32b222a695888ec6104eb2395	2024-11-26 08:11:29.266+03	2024-11-26 08:11:29.265+03	\N	\N	\N	5c6e5866667e81fb4b9f218dda279beb	589a3dc1a0229044135b7d5affe71414	c13d246cff864485640eaf09bd143af2	\N
\.


--
-- Data for Name: oauth_tokens; Type: TABLE DATA; Schema: app_data; Owner: admin
--

COPY app_data.oauth_tokens (id, user_id, access_token, refresh_token, expires_at, provider) FROM stdin;
\.


--
-- Data for Name: password_breach; Type: TABLE DATA; Schema: app_data; Owner: admin
--

COPY app_data.password_breach (id, user_id, password_id, breached_site, password_found_in_breach, breach_date) FROM stdin;
\.


--
-- Data for Name: password_history; Type: TABLE DATA; Schema: app_data; Owner: admin
--

COPY app_data.password_history (id, password_id, previous_password, changed_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: app_data; Owner: admin
--

COPY app_data.sessions (id, user_id, session_token, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: two_factor_auth; Type: TABLE DATA; Schema: app_data; Owner: admin
--

COPY app_data.two_factor_auth (id, user_id, otp_secret, enabled_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: app_data; Owner: admin
--

COPY app_data.users (id, email, password_hash, two_factor_enabled, google_oauth_id, created_at, updated_at, last_login, master_password_hash, master_password_salt, username, email_iv, username_iv, google_oauth_id_iv, reset_token_hash, reset_token_expires) FROM stdin;
f2007df3-cb4e-4b9f-bc64-ccce28d0a90d	df5f4488ae3d937dd8221ca06f88e69d715b04ee7ebe1dd2eb69639edb879a1ef2c17c6c08f0f19d1890304033ccf2b6	$argon2id$v=19$m=65536,t=3,p=3$A9o/NRDD0Z9IOGqi+EkJZQ$sYkofNokrTd/vBqLl7hmMyiccLjaaxzWAWqHJhZQ7Xg	f	aa687ca63265043bd843093d5362f1297ffff20c28a8d25fee433b4c2bd896e0	2024-11-22 23:34:04.079+03	2024-11-22 23:34:04.075+03	\N	\N	\N	980c48522fc65ba397d99bc6d828797b970f4af419384a0168c8d95174cea49f	f881aa1c83731326f4c06b5997b0848a	30391feac3e01a3a7adf24e81a20afbc	8b073f89e4eedb37fd6ae13d182dcd11	\N	\N
2105c1ef-b491-4f21-a4fb-d2b201560e84	fd46243b768f0557c7e00d3feb6edd075747baeb6b58d319fab8db04e29b1372	$argon2id$v=19$m=65536,t=3,p=1$5L0F50QF7zQq5o/1YNKKtw$TeBhv+c15FOpkfnhytPIg3qsAERgwuLzrEoN+5pjsmY	f	\N	2024-11-26 08:02:49.265+03	2024-11-26 08:02:49.258+03	\N	\N	\N	5ef2ba3cdb92c455e43d913694af1569	f881aa1c83731326f4c06b5997b0848a	cda49be597334b13df58d7623c673166	\N	\N	\N
29d4affb-5939-4079-bf48-72d561f55e7f	2f3316a06c642a680fce83ca9786a431b54e5c4a55cae485795c3e5f99f4cd93	$argon2id$v=19$m=65536,t=3,p=1$R6IJb1t2fTXwVubzYT+ljA$28NjiT95NIWMtcHrlmP8Nv4AvsfS0uxIyH0eSlDA7bQ	f	\N	2024-11-26 08:05:19.675+03	2024-11-26 08:08:16.949043+03	2024-11-26 08:08:16.945+03	\N	\N	c4011e96bdb4556cac60ade6f50c1fdd	f881aa1c83731326f4c06b5997b0848a	3f13d9bf77b4da12d385125085f16acb	\N	\N	\N
05f9d46e-605d-40ec-b6fb-0d38c46ae0e4	f3c931e76641c60a97e7c2ea22bd46fd3ed3e097167c089bbad800d66d480961	$argon2id$v=19$m=65536,t=3,p=1$A1URWxI6+7ww8q4rTgTSfw$22PueaeFe3pgK27IjLb2vbDFnyh2B98BAyr6aOsPvjE	f	\N	2024-11-26 14:00:39.944+03	2024-11-26 14:00:39.94+03	\N	\N	\N	c0cf2ccb139860d7e4c3a528443edd7b	f881aa1c83731326f4c06b5997b0848a	4864ac4cb0673f659d615b65ead4fee8	\N	\N	\N
4d29e43d-4484-49a4-baf3-9ab988f17301	73941a58278374ce529561d8ed2818437d8e0fc2b54573a62d6f5825d201521e	$argon2id$v=19$m=65536,t=3,p=1$rIdAzMZr/htotxULqQKunA$+C+N9DuThNpM6Bc8O0ZbX6ICTVhXYIQSRIWJAgRDCxI	f	\N	2024-11-22 22:43:16.31+03	2024-11-26 19:33:12.492687+03	2024-11-26 19:33:12.484+03	\N	\N	809709bea3aa2895691132179765ed56	f881aa1c83731326f4c06b5997b0848a	baa1719f49bb7cc2c61f8dc0bf7999d3	\N	\N	\N
3721fc95-3b39-4f57-bf4a-46c050ef92c5	80e3341bde4e9e35b9d4e7a418b32847964a285585c731324ebea5cfd1fd70e9	$argon2id$v=19$m=65536,t=3,p=1$rQ8gUenJjMM5a6UAK6wJGA$BOM2xbBWtAnoFRWjvp33YRtCJG8wmEf1qFXWDw7C5DY	f	\N	2024-11-22 23:42:20.34+03	2024-11-27 01:13:50.136528+03	2024-11-27 01:13:50.119+03	\N	\N	0400456cb2adb5ae08a323f15563b083	f881aa1c83731326f4c06b5997b0848a	bb7115a4ef7c5750deab4a7993b4563d	\N	\N	\N
1887d857-3587-4f16-9090-e4baca512b7c	c5fc1bb4b60f3ba8603acb6115b474a112ba1867c2c61f54a5691740e99dce19	$argon2id$v=19$m=65536,t=3,p=1$QtGhUzN0wUaA+kolyA6Pnw$9Pb+Zp0B0aKQEpu3q5zzPgZYWJF9VphdgM5Zg9Q8slw	f	\N	2024-11-27 01:14:54.41+03	2024-11-27 01:15:09.91717+03	2024-11-27 01:15:09.914+03	\N	\N	64fb102def7c40e37d5142ab609fe359	f881aa1c83731326f4c06b5997b0848a	e6497c813c8483bb5c2f651ff0a1d909	\N	\N	\N
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.audit_logs (id, user_id, action, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_tokens; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.oauth_tokens (id, user_id, access_token, refresh_token, expires_at, provider) FROM stdin;
\.


--
-- Data for Name: password_breach; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.password_breach (id, user_id, password_id, breached_site, password_found_in_breach, breach_date) FROM stdin;
\.


--
-- Data for Name: password_history; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.password_history (id, password_id, previous_password, changed_at) FROM stdin;
\.


--
-- Data for Name: passwords; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.passwords (id, user_id, site_name, url, username, encrypted_password, password_salt, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.sessions (id, user_id, session_token, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: two_factor_auth; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.two_factor_auth (id, user_id, otp_secret, enabled_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, email, password_hash, two_factor_enabled, google_oauth_id, created_at, updated_at, last_login) FROM stdin;
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: oauth_tokens oauth_tokens_pkey; Type: CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.oauth_tokens
    ADD CONSTRAINT oauth_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_breach password_breach_pkey; Type: CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.password_breach
    ADD CONSTRAINT password_breach_pkey PRIMARY KEY (id);


--
-- Name: password_history password_history_pkey; Type: CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.password_history
    ADD CONSTRAINT password_history_pkey PRIMARY KEY (id);


--
-- Name: credentials passwords_pkey; Type: CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.credentials
    ADD CONSTRAINT passwords_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: two_factor_auth two_factor_auth_pkey; Type: CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.two_factor_auth
    ADD CONSTRAINT two_factor_auth_pkey PRIMARY KEY (id);


--
-- Name: two_factor_auth two_factor_auth_user_id_key; Type: CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.two_factor_auth
    ADD CONSTRAINT two_factor_auth_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: oauth_tokens oauth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.oauth_tokens
    ADD CONSTRAINT oauth_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_breach password_breach_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.password_breach
    ADD CONSTRAINT password_breach_pkey PRIMARY KEY (id);


--
-- Name: password_history password_history_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT password_history_pkey PRIMARY KEY (id);


--
-- Name: passwords passwords_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.passwords
    ADD CONSTRAINT passwords_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: two_factor_auth two_factor_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.two_factor_auth
    ADD CONSTRAINT two_factor_auth_pkey PRIMARY KEY (id);


--
-- Name: two_factor_auth two_factor_auth_user_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.two_factor_auth
    ADD CONSTRAINT two_factor_auth_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_user_id; Type: INDEX; Schema: app_data; Owner: admin
--

CREATE INDEX idx_audit_user_id ON app_data.audit_logs USING btree (user_id);


--
-- Name: idx_breach_user_id; Type: INDEX; Schema: app_data; Owner: admin
--

CREATE INDEX idx_breach_user_id ON app_data.password_breach USING btree (user_id);


--
-- Name: idx_oauth_user_id; Type: INDEX; Schema: app_data; Owner: admin
--

CREATE INDEX idx_oauth_user_id ON app_data.oauth_tokens USING btree (user_id);


--
-- Name: idx_password_user_id; Type: INDEX; Schema: app_data; Owner: admin
--

CREATE INDEX idx_password_user_id ON app_data.credentials USING btree (user_id);


--
-- Name: idx_session_user_id; Type: INDEX; Schema: app_data; Owner: admin
--

CREATE INDEX idx_session_user_id ON app_data.sessions USING btree (user_id);


--
-- Name: idx_user_email; Type: INDEX; Schema: app_data; Owner: admin
--

CREATE INDEX idx_user_email ON app_data.users USING btree (email);


--
-- Name: idx_audit_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_breach_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_breach_user_id ON public.password_breach USING btree (user_id);


--
-- Name: idx_oauth_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_oauth_user_id ON public.oauth_tokens USING btree (user_id);


--
-- Name: idx_password_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_password_user_id ON public.passwords USING btree (user_id);


--
-- Name: idx_session_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_session_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_email ON public.users USING btree (email);


--
-- Name: credentials update_passwords_modtime; Type: TRIGGER; Schema: app_data; Owner: admin
--

CREATE TRIGGER update_passwords_modtime BEFORE UPDATE ON app_data.credentials FOR EACH ROW EXECUTE FUNCTION app_data.update_timestamp();


--
-- Name: users update_users_modtime; Type: TRIGGER; Schema: app_data; Owner: admin
--

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON app_data.users FOR EACH ROW EXECUTE FUNCTION app_data.update_timestamp();


--
-- Name: passwords update_passwords_modtime; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER update_passwords_modtime BEFORE UPDATE ON public.passwords FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: users update_users_modtime; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_data.users(id) ON DELETE CASCADE;


--
-- Name: credentials fk_user_id; Type: FK CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.credentials
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES app_data.users(id);


--
-- Name: oauth_tokens oauth_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.oauth_tokens
    ADD CONSTRAINT oauth_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_data.users(id) ON DELETE CASCADE;


--
-- Name: password_breach password_breach_password_id_fkey; Type: FK CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.password_breach
    ADD CONSTRAINT password_breach_password_id_fkey FOREIGN KEY (password_id) REFERENCES app_data.credentials(id) ON DELETE CASCADE;


--
-- Name: password_breach password_breach_user_id_fkey; Type: FK CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.password_breach
    ADD CONSTRAINT password_breach_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_data.users(id) ON DELETE CASCADE;


--
-- Name: password_history password_history_password_id_fkey; Type: FK CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.password_history
    ADD CONSTRAINT password_history_password_id_fkey FOREIGN KEY (password_id) REFERENCES app_data.credentials(id) ON DELETE CASCADE;


--
-- Name: credentials passwords_user_id_fkey; Type: FK CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.credentials
    ADD CONSTRAINT passwords_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_data.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_data.users(id) ON DELETE CASCADE;


--
-- Name: two_factor_auth two_factor_auth_user_id_fkey; Type: FK CONSTRAINT; Schema: app_data; Owner: admin
--

ALTER TABLE ONLY app_data.two_factor_auth
    ADD CONSTRAINT two_factor_auth_user_id_fkey FOREIGN KEY (user_id) REFERENCES app_data.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oauth_tokens oauth_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.oauth_tokens
    ADD CONSTRAINT oauth_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_breach password_breach_password_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.password_breach
    ADD CONSTRAINT password_breach_password_id_fkey FOREIGN KEY (password_id) REFERENCES public.passwords(id) ON DELETE CASCADE;


--
-- Name: password_breach password_breach_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.password_breach
    ADD CONSTRAINT password_breach_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_history password_history_password_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.password_history
    ADD CONSTRAINT password_history_password_id_fkey FOREIGN KEY (password_id) REFERENCES public.passwords(id) ON DELETE CASCADE;


--
-- Name: passwords passwords_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.passwords
    ADD CONSTRAINT passwords_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: two_factor_auth two_factor_auth_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.two_factor_auth
    ADD CONSTRAINT two_factor_auth_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: TABLE passwords; Type: ACL; Schema: public; Owner: admin
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.passwords TO student_test;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: admin
--

GRANT SELECT ON TABLE public.users TO student_test;


--
-- PostgreSQL database dump complete
--

