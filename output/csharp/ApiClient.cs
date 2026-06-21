// Auto-generated SDK for Demo API v1.0.0
// Do not edit manually

using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SDKCraft
{
  public class ApiClient
  {
    private readonly HttpClient _client = new HttpClient();
    private const string BaseUrl = "https://api.example.com/v1";

    public void SetApiKey(string key) =>
      _client.DefaultRequestHeaders.Add("X-API-Key", key);

    public void SetBearerToken(string token) =>
      _client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", token);

    private async Task<string> RequestAsync(string method, string path, object? body = null)
    {
      var url = BaseUrl + path;
      HttpResponseMessage response;
      if (method == "GET")
        response = await _client.GetAsync(url);
      else
      {
        var json = body != null ? JsonSerializer.Serialize(body) : "{}";
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        response = method == "POST"
          ? await _client.PostAsync(url, content)
          : method == "PUT"
            ? await _client.PutAsync(url, content)
            : await _client.DeleteAsync(url);
      }
      response.EnsureSuccessStatusCode();
      return await response.Content.ReadAsStringAsync();
    }

    /// <summary>Get all users</summary>
    public async Task<string> GetUsersAsync() =>
      await RequestAsync("GET", "/users");

    /// <summary>Create a new user</summary>
    public async Task<string> CreateUserAsync(object? body = null) =>
      await RequestAsync("POST", "/users", body);

    /// <summary>Get user by ID</summary>
    public async Task<string> GetUserByIdAsync(string id) =>
      await RequestAsync("GET", $"/users/{id}");

    /// <summary>Get all products</summary>
    public async Task<string> GetProductsAsync() =>
      await RequestAsync("GET", "/products");

  }
}