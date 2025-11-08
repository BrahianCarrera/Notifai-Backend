import AppDrawer, { AppDrawerRef } from "@/components/AppDrawer";
import ArticleCard from "@/components/Card";
import FeaturedCard from "@/components/FeaturedCard";
import {
  apiToggleFavorite,
  apiToggleLike,
  fetchArticles,
  fetchCategories,
} from "@/utils/apiService";
import { Href, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  Appbar,
  Chip,
  Divider,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

type UiArticle = {
  id: string;
  title: string;
  summary: string;
  category: string;
  imageUrl: string;
  views: string;
  isBookmarked?: boolean;
  likes: number;
};

type Category = {
  id: number;
  name: string;
};

const formatViews = (viewsCount?: number): string => {
  if (!viewsCount) return "0";
  if (viewsCount >= 1000000) return `${(viewsCount / 1000000).toFixed(1)}M`;
  if (viewsCount >= 1000) return `${(viewsCount / 1000).toFixed(1)}K`;
  return String(viewsCount);
};

export default function Index() {
  const theme = useTheme();
  const router = useRouter();
  const drawerRef = useRef<AppDrawerRef>(null);
  const [categories, setCategories] = useState<Category[]>([
    { id: 0, name: "Todo" },
  ]);
  const [selectedCategory, setSelectedCategory] = useState<Category>({
    id: 0,
    name: "Todo",
  });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<UiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const fetchedCategories: any[] = await fetchCategories();
        const mappedCategories: Category[] = fetchedCategories.map(
          (c: any) => ({
            id: c.id,
            name: c.name,
          })
        );

        if (isMounted)
          setCategories([{ id: 0, name: "Todo" }, ...mappedCategories]);
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Error cargando categorías");
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchArticles({
          page: 1,
          limit: 10,
          search: searchQuery.trim(),
          category: selectedCategory.id,
          sort: "published_at",
          order: "desc",
          signal: controller.signal,
        });

        if (data && isMounted) {
          const apiArticles: any[] = data.articles || [];
          const mapped: UiArticle[] = apiArticles.map((a: any) => ({
            id: String(a.id),
            title: a.title,
            summary: a.summary,
            category: a.category_name || "",
            imageUrl: a.image_url || "https://placehold.co/600x400/png",
            views: formatViews(a.views_count),
            isBookmarked: a.is_favorite,
            likes: a.likes_count,
          }));
          setArticles(mapped);
        }
      } catch (e: any) {
        if (isMounted && e.name !== "AbortError") {
          setError(e?.message || "Error cargando artículos");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [selectedCategory.id, searchQuery]);

  const featured = useMemo<UiArticle | null>(() => {
    if (!articles.length) return null;
    return articles[0];
  }, [articles]);

  const handleToggleFavorite = async (id: string) => {
    try {
      const response = await apiToggleFavorite(id);

      if (response.success) {
        const newFavoriteState: boolean =
          response.data?.is_favorite ?? response.is_favorite;

        if (newFavoriteState !== undefined) {
          setArticles((prev) =>
            prev.map((a) =>
              a.id === id ? { ...a, isBookmarked: newFavoriteState } : a
            )
          );
        }
      }
    } catch (e: any) {
      console.error("Error toggling favorite:", e);
    }
  };

  const handleToggleLike = async (id: string) => {
    try {
      const response = await apiToggleLike(id);
      if (response.success) {
        const newLikesCount =
          response.data?.likes_count ?? response.likes_count;

        if (newLikesCount !== undefined) {
          setArticles((prev) =>
            prev.map((a) =>
              a.id === id
                ? {
                    ...a,
                    likes: newLikesCount,
                  }
                : a
            )
          );
        }
      }
    } catch (e: any) {
      console.error("Error toggling like:", e);
      window.alert("Error al actualizar like: " + e.message);
    }
  };

  const handleCardPress = (id: string) => {
    console.log(`Abriendo detalles del artículo ID: ${id}`);
    // router.push(`/article/${id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppDrawer
        ref={drawerRef}
        onProfilePress={() => {
          router.push("/profile" as Href);
        }}
        onHomePress={() => {
          router.push("/home" as Href);
        }}
        onBookmarksPress={() => {
          router.push("/bookmarks" as Href);
        }}
        onHistoryPress={() => {
          // TODO: Navegar a la pantalla de historial cuando esté disponible
          console.log("Navegar a Historial");
        }}
      />

      <Appbar.Header mode="small">
        <Appbar.Action
          icon="menu"
          onPress={() => drawerRef.current?.open()}
          accessibilityLabel="Menu"
        />

        {!showSearch ? (
          <>
            <Appbar.Content title="NotifIA" />
            <IconButton
              icon="magnify"
              onPress={() => setShowSearch(true)}
              accessibilityLabel="Buscar"
            />
          </>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <TextInput
                mode="outlined"
                placeholder="Buscar..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  height: 40,
                }}
                autoFocus
              />
            </View>
            <Appbar.Action
              icon="close"
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
              }}
            />
          </>
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            paddingTop: 8,
          }}
        >
          {categories.map((c) => (
            <Chip
              key={c.id}
              selected={selectedCategory.id === c.id}
              onPress={() => setSelectedCategory(c)}
            >
              {c.name}
            </Chip>
          ))}
        </ScrollView>

        {featured && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <FeaturedCard article={featured} />
          </View>
        )}

        <Divider style={{ marginHorizontal: 16, marginVertical: 8 }} />

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {loading && <Text style={{ opacity: 0.6 }}>Cargando artículos…</Text>}
          {!!error && (
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          )}
          {!loading &&
            !error &&
            articles.map((item) => (
              <ArticleCard
                key={item.id}
                id={item.id}
                title={item.title}
                summary={item.summary}
                likes={item.likes ?? 0}
                isBookmarked={item.isBookmarked ?? false}
                onToggleFavorite={handleToggleFavorite}
                onToggleLike={handleToggleLike}
                category={item.category}
                imageUrl={item.imageUrl}
                views={item.views}
              />
            ))}
        </View>
      </ScrollView>
    </View>
  );
}
