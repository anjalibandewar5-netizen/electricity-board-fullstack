
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Row, Col, Form, Button, Container, Alert } from "react-bootstrap";
import Messages from './Messages';

function EditApplicant() {
  const { id } = useParams();

  const [applicantData, setApplicantData] = useState({});
  const [connectionData, setConnectionData] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(false);

  const [applicant, setApplicant] = useState({
    Applicant_Name: "",
    Gender: "",
    District: "",
    State: "",
    Pincode: "",
    Ownership: "",
    GovtID_Type: "",
    ID_Number: "",
    Category: "",
  });

  const [connection, setConnection] = useState({
    Applicant: "",
    Load_Applied: "",
    Date_of_Application: "",
    Date_of_Approval: "",
    Modified_Date: "",
    Status: "",
    Reviewer_ID: "",
    Reviewer_Name: "",
    Reviewer_Comments: "",
  });

  const fetchApplicantData = async () => {
    try {
      const response = await fetch(`/api/update_applicantData/${id}/`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch applicant data");
      }

      setApplicantData(data.applicant);
      setConnectionData(data.connection);

      setApplicant(data.applicant);
      setConnection(data.connection);
    } catch (error) {
      console.error("Error fetching applicant data:", error);
      setMessageType("danger");
      setMessage(error.message);
    }
  };

  useEffect(() => {
    fetchApplicantData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name in applicant) {
      setApplicant((previous) => ({
        ...previous,
        [name]: value,
      }));

      setApplicantData((previous) => ({
        ...previous,
        [name]: value,
      }));
    } else {
      setConnection((previous) => ({
        ...previous,
        [name]: value,
      }));

      setConnectionData((previous) => ({
        ...previous,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      connectionData.Load_Applied === "" ||
      Number(connectionData.Load_Applied) <= 0 ||
      Number(connectionData.Load_Applied) > 200
    ) {
      setMessageType("danger");
      setMessage("Load Applied must be between 1 and 200.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/update_applicantData/${id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicant: applicant,
          connection: connection,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update applicant data.");
      }

      setMessageType("success");
      setMessage(result.success || "Applicant/Connection details updated.");

      await fetchApplicantData();
    } catch (error) {
      console.error("Error updating applicant data:", error);
      setMessageType("danger");
      setMessage(error.message || "Error updating applicant data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container>
        <div className="row">
          <div className="col-md-3">
            <Link to="/" className="btn btn-dark my-1">
              Go Back
            </Link>
          </div>
        </div>

        <hr />

        <h5>Edit Applicant or Connection Details</h5>
        <hr />

        {message && (
          <Alert
            variant={messageType}
            dismissible
            onClose={() => setMessage("")}
          >
            {message}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group controlId="Applicant_Name" className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control
                  type="text"
                  name="Applicant_Name"
                  value={applicantData.Applicant_Name || ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group controlId="Gender" className="mb-3">
                <Form.Label>Gender</Form.Label>
                <Form.Select
                  name="Gender"
                  value={applicantData.Gender || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="District" className="mb-3">
                <Form.Label>District</Form.Label>
                <Form.Control
                  type="text"
                  name="District"
                  value={applicantData.District || ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group controlId="State" className="mb-3">
                <Form.Label>State</Form.Label>
                <Form.Control
                  type="text"
                  name="State"
                  value={applicantData.State || ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group controlId="Pincode" className="mb-3">
                <Form.Label>Pincode</Form.Label>
                <Form.Control
                  type="number"
                  name="Pincode"
                  value={applicantData.Pincode || ""}
                  onChange={handleChange}
                  min="100000"
                  max="999999"
                  required
                />
              </Form.Group>

              <Form.Group controlId="Ownership" className="mb-3">
                <Form.Label>Ownership</Form.Label>
                <Form.Select
                  name="Ownership"
                  value={applicantData.Ownership || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="JOINT">Joint</option>
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="GovtID_Type" className="mb-3">
                <Form.Label>Government ID Type</Form.Label>
                <Form.Select
                  name="GovtID_Type"
                  value={applicantData.GovtID_Type || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="AADHAR">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="VOTER_ID">Voter ID</option>
                  <option value="PASSPORT">Passport</option>
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="ID_Number" className="mb-3">
                <Form.Label>ID Number</Form.Label>
                <Form.Control
                  type="text"
                  name="ID_Number"
                  value={applicantData.ID_Number || ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="Category" className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="Category"
                  value={applicantData.Category || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="Load_Applied" className="mb-3">
                <Form.Label>Load Applied</Form.Label>
                <Form.Control
                  type="number"
                  name="Load_Applied"
                  value={connectionData.Load_Applied ?? ""}
                  onChange={handleChange}
                  min="1"
                  max="200"
                  required
                />
              </Form.Group>

              <Form.Group controlId="Date_of_Application" className="mb-3">
                <Form.Label>Date of Application</Form.Label>
                <Form.Control
                  type="date"
                  name="Date_of_Application"
                  value={connectionData.Date_of_Application || ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group controlId="Date_of_Approval" className="mb-3">
                <Form.Label>Date of Approval</Form.Label>
                <Form.Control
                  type="date"
                  name="Date_of_Approval"
                  value={connectionData.Date_of_Approval || ""}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group controlId="Modified_Date" className="mb-3">
                <Form.Label>Modified Date</Form.Label>
                <Form.Control
                  type="date"
                  name="Modified_Date"
                  value={connectionData.Modified_Date || ""}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group controlId="Status" className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="Status"
                  value={connectionData.Status || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="Connection Released">Connection Released</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="Reviewer_ID" className="mb-3">
                <Form.Label>Reviewer ID</Form.Label>
                <Form.Control
                  type="number"
                  name="Reviewer_ID"
                  value={connectionData.Reviewer_ID ?? ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group controlId="Reviewer_Name" className="mb-3">
                <Form.Label>Reviewer Name</Form.Label>
                <Form.Control
                  type="text"
                  name="Reviewer_Name"
                  value={connectionData.Reviewer_Name || ""}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group controlId="Reviewer_Comments" className="mb-3">
                <Form.Label>Reviewer Comments</Form.Label>
                <Form.Select
                  name="Reviewer_Comments"
                  value={connectionData.Reviewer_Comments || ""}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Reviewer Comments</option>
                  <option value="Installation pending">Installation pending</option>
                  <option value="Documents verification in progress">
                    Documents verification in progress
                  </option>
                  <option value="Installation completed">
                    Installation completed
                  </option>
                  <option value="KYC failed">KYC Failed</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Button
            type="submit"
            variant="dark"
            className="mt-3 text-center"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update"}
          </Button>

          <br />
          <br />
          <br />
        </Form>
      </Container>
    </>
  );
}

export default EditApplicant;
