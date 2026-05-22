// Auto-generated SDK for Demo API v1.0.0
// Do not edit manually

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class ApiClient {

  private static final String BASE_URL = "https://api.example.com/v1";
  private String apiKey = "";
  private String bearerToken = "";
  private final HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(30)).build();

  public void setApiKey(String key) { this.apiKey = key; }
  public void setBearerToken(String token) { this.bearerToken = token; }

  private String request(String method, String path, String body) throws Exception {
    HttpRequest.Builder builder = HttpRequest.newBuilder()
      .uri(URI.create(BASE_URL + path))
      .header("Content-Type", "application/json");
    if (!apiKey.isEmpty()) builder.header("X-API-Key", apiKey);
    if (!bearerToken.isEmpty()) builder.header("Authorization", "Bearer " + bearerToken);
    if (method.equals("GET")) builder.GET();
    else builder.method(method, HttpRequest.BodyPublishers.ofString(body != null ? body : ""));
    HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() >= 400)
      throw new RuntimeException("API Error: " + response.statusCode());
    return response.body();
  }

  /** Get all users */
  public String getUsers() throws Exception {
    return request("GET", "/users", null);
  }

  /** Create a new user */
  public String createUser(String body) throws Exception {
    return request("POST", "/users", body);
  }

  /** Get user by ID */
  public String getUserById(String id) throws Exception {
    return request("GET", "/users/" + id + "", null);
  }

  /** Get all products */
  public String getProducts() throws Exception {
    return request("GET", "/products", null);
  }

}