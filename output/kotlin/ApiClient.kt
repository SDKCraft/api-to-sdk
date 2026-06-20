// Auto-generated SDK for Demo API v1.0.0
// Do not edit manually

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

// ---- Models ----

data class User(
  val id: String,
  val name: String,
  val email: String,
  val age: $base? = null
)

data class CreateUserRequest(
  val name: String,
  val email: String
)

data class Product(
  val id: String,
  val name: String,
  val price: Double,
  val inStock: $base? = null
)

class DemoAPIClient(
  private val baseUrl: String = "https://api.example.com/v1",
  private val apiKey: String? = null,
  private val bearerToken: String? = null,
  private val timeout: Int = 30000
) {

  private suspend fun request(method: String, path: String, body: String? = null): String =
    withContext(Dispatchers.IO) {
      val url = URL(baseUrl + path)
      val conn = url.openConnection() as HttpURLConnection
      conn.requestMethod = method
      conn.connectTimeout = timeout
      conn.readTimeout = timeout
      conn.setRequestProperty("Content-Type", "application/json")
      apiKey?.let { conn.setRequestProperty("X-API-Key", it) }
      bearerToken?.let { conn.setRequestProperty("Authorization", "Bearer $it") }
      if (body != null) {
        conn.doOutput = true
        conn.outputStream.write(body.toByteArray())
      }
      val code = conn.responseCode
      if (code !in 200..299) throw Exception("API Error $code: ${conn.responseMessage}")
      conn.inputStream.bufferedReader().readText()
    }

  /** Get all users */
  suspend fun getUsers(): User[] {
    val json = request("GET", "/users")
    return json as User[]
  }

  /** Create a new user */
  suspend fun createUser(body: CreateUserRequest? = null): User {
    val json = request("POST", `/users`, body?.toString())
    return json as User
  }

  /** Get user by ID */
  suspend fun getUserById(id: String): User {
    val json = request("GET", "/users/${id}")
    return json as User
  }

  /** Get all products */
  suspend fun getProducts(): Product[] {
    val json = request("GET", "/products")
    return json as Product[]
  }

}