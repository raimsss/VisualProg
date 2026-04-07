import { useEffect, useState } from "react";

function BookCard({ title, authors, imageBlob }) {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!imageBlob) {
      setImageUrl("");
      return;
    }

    const url = URL.createObjectURL(imageBlob);
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageBlob]);

  return (
    <div className="book-card">
      {imageUrl ? (
        <img className="book-image" src={imageUrl} alt={title} />
      ) : (
        <div className="book-placeholder">
          <div className="placeholder-title">{title}</div>
        </div>
      )}

      <div className="book-title">{title}</div>
      <div className="book-authors">
        {authors && authors.length > 0
          ? authors.join(", ")
          : "Автор неизвестен"}
      </div>
    </div>
  );
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooks() {
      try {
        const res = await fetch("https://fakeapi.extendsclass.com/books");
        const data = await res.json();

        const booksWithImages = await Promise.all(
          data.slice(0, 15).map(async (book) => {
            try {
              let thumbnail = null;

              try {
                const resByIsbn = await fetch(
                  `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.isbn}`
                );
                const dataByIsbn = await resByIsbn.json();

                thumbnail =
                  dataByIsbn?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
              } catch {}

              if (!thumbnail) {
                try {
                  const resByTitle = await fetch(
                    `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
                      book.title
                    )}`
                  );
                  const dataByTitle = await resByTitle.json();

                  thumbnail =
                    dataByTitle?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
                } catch {}
              }

              let imageBlob = null;

              if (thumbnail) {
                const imageResponse = await fetch(thumbnail);
                imageBlob = await imageResponse.blob();
              }

              return {
                ...book,
                imageBlob,
              };
            } catch {
              return {
                ...book,
                imageBlob: null,
              };
            }
          })
        );

        setBooks(booksWithImages);
      } catch (error) {
        console.error("Ошибка загрузки книг:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  if (loading) {
    return <div className="status">Загрузка...</div>;
  }

  return (
    <div className="app">
      <h1>Список книг</h1>

      <div className="books-container">
        {books.map((book) => (
          <BookCard
            key={book.id}
            title={book.title}
            authors={book.authors}
            imageBlob={book.imageBlob}
          />
        ))}
      </div>
    </div>
  );
}