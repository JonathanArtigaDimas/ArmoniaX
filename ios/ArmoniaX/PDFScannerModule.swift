import Foundation
import PDFKit

@objc(PDFScannerModule)
class PDFScannerModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc func buscarCantoEnPDF(
    _ nombreCanto: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      guard let self = self else {
        reject("MODULE_DESTROYED", "El módulo fue destruido", nil)
        return
      }

      do {
        guard let pdfURL = Bundle.main.url(forResource: "iResucitó-es-US", withExtension: "pdf") else {
          reject("PDF_NOT_FOUND", "No se encontró el archivo PDF en assets", nil)
          return
        }

        guard let pdfDocument = PDFDocument(url: pdfURL) else {
          reject("PDF_LOAD_ERROR", "No se pudo abrir el archivo PDF", nil)
          return
        }

        let nombreLower = nombreCanto.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let totalPages = pdfDocument.pageCount
        var resultPage = -1
        var resultCantoNumber = ""

        for pageNum in 0..<totalPages {
          guard let page = pdfDocument.page(at: pageNum) else { continue }

          guard let pageString = page.string else { continue }

          if pageString.lowercased().contains(nombreLower) {
            resultPage = pageNum + 1

            let cantoRegex = try! NSRegularExpression(
              pattern: #"(?:^|\n)\s*(\d{1,4})\s*(?:\n|$)"#,
              options: []
            )
            let range = NSRange(pageString.startIndex..<pageString.endIndex, in: pageString)
            let matches = cantoRegex.matches(in: pageString, options: [], range: range)

            for match in matches {
              if let matchRange = Range(match.range(at: 1), in: pageString) {
                let candidate = String(pageString[matchRange]).trimmingCharacters(in: .whitespaces)
                if candidate.count >= 1 && candidate.count <= 4 {
                  resultCantoNumber = candidate
                  break
                }
              }
            }

            if resultCantoNumber.isEmpty {
              let titleRegex = try! NSRegularExpression(
                pattern: #"(\d{1,4})\s"#,
                options: []
              )
              let titleMatches = titleRegex.matches(in: pageString, options: [], range: range)
              if let firstMatch = titleMatches.first,
                 let matchRange = Range(firstMatch.range(at: 1), in: pageString) {
                resultCantoNumber = String(pageString[matchRange])
              }
            }

            break
          }
        }

        pdfDocument.unlock()

        if resultPage > 0 {
          let result: [String: Any] = [
            "status": "success",
            "nombre": nombreCanto,
            "pagina": String(resultPage),
            "numeroCanto": resultCantoNumber
          ]
          resolve(result)
        } else {
          let result: [String: Any] = [
            "status": "not_found"
          ]
          resolve(result)
        }

      } catch {
        reject("PDF_SCAN_ERROR", error.localizedDescription, error)
      }
    }
  }
}
