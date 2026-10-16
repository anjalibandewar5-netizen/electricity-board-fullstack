
import React from "react";
import { useState, useEffect } from "react";
import { Row, Col, Button, ButtonGroup, Form, Modal, Alert, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Home.css";

function Home() {
    const [data, setData] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const initialApplicant = {
        Applicant_Name: "",
        Gender: "Male",
        District: "",
        State: "",
        Pincode: "",
        Ownership: "INDIVIDUAL",
        GovtID_Type: "AADHAR",
        ID_Number: "",
        Category: "Residential"
    };

    const initialConnection = {
        Load_Applied: "",
        Date_of_Application: "",
        Date_of_Approval: "",
        Modified_Date: "",
        Status: "Pending",
        Reviewer_ID: "",
        Reviewer_Name: "",
        Reviewer_Comments: "Installation pending"
    };

    const [newApplicant, setNewApplicant] = useState(initialApplicant);
    const [newConnection, setNewConnection] = useState(initialConnection);

    useEffect(() => {
        fetchData();
    }, [currentPage, startDate, endDate, searchQuery]);

    const fetchData = async () => {
        try {
            let url = `/api/getApplicantsData/?page=${currentPage}`;

            if (startDate) {
                url += `&start_date=${startDate.getFullYear()}-${String(
                    startDate.getMonth() + 1
                ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
            }

            if (endDate) {
                url += `&end_date=${endDate.getFullYear()}-${String(
                    endDate.getMonth() + 1
                ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;
            }

            if (searchQuery.trim()) {
                url += `&search=${encodeURIComponent(searchQuery.trim())}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Failed to fetch applicant data");
            }

            const jsonData = await response.json();

            setData(jsonData.data || []);
            setTotalPages(jsonData.total_pages || 1);
        } catch (error) {
            console.log("Error fetching data:", error);
        }
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
        setCurrentPage(1);
    };

    const handleStartDateChange = (date) => {
        setStartDate(date);
        setCurrentPage(1);
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);
        setCurrentPage(1);
    };

    const handleFirstPageClick = () => setCurrentPage(1);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleLastPageClick = () => setCurrentPage(totalPages);

    const handlePageClick = (page) => setCurrentPage(page);

    const handleApplicantChange = (event) => {
        const { name, value } = event.target;

        setNewApplicant((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleConnectionChange = (event) => {
        const { name, value } = event.target;

        setNewConnection((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleCreateApplicant = async (event) => {
        event.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const response = await fetch("/api/create_applicant/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    applicant: newApplicant,
                    connection: newConnection
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Unable to create applicant");
            }

            setMessageType("success");
            setMessage(result.success || "Applicant created successfully");

            setNewApplicant(initialApplicant);
            setNewConnection(initialConnection);
            setShowCreateForm(false);
            setCurrentPage(1);

            await fetchData();
        } catch (error) {
            setMessageType("danger");
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteApplicant = async (connectionId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this connection?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                `/api/delete_applicant/${connectionId}/`,
                {
                    method: "DELETE"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Unable to delete record");
            }

            setMessageType("success");
            setMessage(result.success || "Record deleted successfully");

            if (data.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                await fetchData();
            }
        } catch (error) {
            setMessageType("danger");
            setMessage(error.message);
        }
    };

    return (
        <>
            <div className="container mt-2">
                <h1>Applicant Details</h1>
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

                <div className="mb-3">
                    <Button
                        variant="primary"
                        onClick={() => {
                            setMessage("");
                            setShowCreateForm(true);
                        }}
                    >
                        Add Applicant
                    </Button>
                </div>

                <Row className="g-2 align-items-end">
                    <Col md={2}>
                        <Form.Label>From Date</Form.Label>
                        <DatePicker
                            selected={startDate}
                            className="form-control"
                            onChange={handleStartDateChange}
                            placeholderText="From Date"
                            dateFormat="yyyy-MM-dd"
                        />
                    </Col>

                    <Col md={2}>
                        <Form.Label>To Date</Form.Label>
                        <DatePicker
                            selected={endDate}
                            className="form-control"
                            onChange={handleEndDateChange}
                            placeholderText="To Date"
                            dateFormat="yyyy-MM-dd"
                            minDate={startDate || undefined}
                        />
                    </Col>

                    <Col md={5}>
                        <Form.Label>Search Applicants</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Search by name, district, status..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </Col>
                </Row>

                <hr />

                <div className="table-container">
                    <table className="table table-bordered">
                        <thead className="sticky-header">
                            <tr>
                                <th>ID</th>
                                <th>Applicant Name</th>
                                <th>Gender</th>
                                <th>District</th>
                                <th>State</th>
                                <th>Pincode</th>
                                <th>Ownership</th>
                                <th>Govt ID Type</th>
                                <th>ID Number</th>
                                <th>Category</th>
                                <th>Load Applied</th>
                                <th>Date of Application</th>
                                <th>Status</th>
                                <th>Reviewer ID</th>
                                <th>Reviewer Name</th>
                                <th>Reviewer Comments</th>
                                <th>Edit</th>
                                <th>Delete</th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.length > 0 ? (
                                data.map((connection) => (
                                    <tr key={connection.id}>
                                        <td>{connection.id}</td>
                                        <td>{connection.Applicant?.Applicant_Name}</td>
                                        <td>{connection.Applicant?.Gender}</td>
                                        <td>{connection.Applicant?.District}</td>
                                        <td>{connection.Applicant?.State}</td>
                                        <td>{connection.Applicant?.Pincode}</td>
                                        <td>{connection.Applicant?.Ownership}</td>
                                        <td>{connection.Applicant?.GovtID_Type}</td>
                                        <td>{connection.Applicant?.ID_Number}</td>
                                        <td>{connection.Applicant?.Category}</td>
                                        <td>{connection.Load_Applied}</td>
                                        <td>{connection.Date_of_Application}</td>
                                        <td>{connection.Status}</td>
                                        <td>{connection.Reviewer_ID}</td>
                                        <td>{connection.Reviewer_Name}</td>
                                        <td>{connection.Reviewer_Comments}</td>

                                        <td>
                                            <Link
                                                to={`/editApplicant/${connection.id}`}
                                                className="btn btn-outline-success btn-sm"
                                            >
                                                <i className="fa-solid fa-pen-to-square"></i>{" "}
                                                Edit
                                            </Link>
                                        </td>

                                        <td>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() =>
                                                    handleDeleteApplicant(connection.id)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="18" className="text-center">
                                        No applicants found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pagination-controls mt-3">
                    <ButtonGroup>
                        <Button
                            onClick={handleFirstPageClick}
                            disabled={currentPage === 1}
                        >
                            First
                        </Button>

                        <Button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>

                        {[...Array(totalPages)].map((_, index) => (
                            <Button
                                key={index}
                                onClick={() => handlePageClick(index + 1)}
                                active={currentPage === index + 1}
                            >
                                {index + 1}
                            </Button>
                        ))}

                        <Button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>

                        <Button
                            onClick={handleLastPageClick}
                            disabled={currentPage === totalPages}
                        >
                            Last
                        </Button>
                    </ButtonGroup>
                </div>

                <p className="mt-2">
                    Page {currentPage} of {totalPages}
                </p>
            </div>

            <Modal
                show={showCreateForm}
                onHide={() => setShowCreateForm(false)}
                size="lg"
                centered
                scrollable
            >
                <Modal.Header closeButton>
                    <Modal.Title>Add Applicant</Modal.Title>
                </Modal.Header>

                <Form onSubmit={handleCreateApplicant}>
                    <Modal.Body>
                        <h5>Applicant Details</h5>

                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label>Applicant Name</Form.Label>
                                <Form.Control
                                    name="Applicant_Name"
                                    value={newApplicant.Applicant_Name}
                                    onChange={handleApplicantChange}
                                    required
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label>Gender</Form.Label>
                                <Form.Select
                                    name="Gender"
                                    value={newApplicant.Gender}
                                    onChange={handleApplicantChange}
                                    required
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </Form.Select>
                            </Col>

                            <Col md={6}>
                                <Form.Label>District</Form.Label>
                                <Form.Control
                                    name="District"
                                    value={newApplicant.District}
                                    onChange={handleApplicantChange}
                                    required
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label>State</Form.Label>
                                <Form.Control
                                    name="State"
                                    value={newApplicant.State}
                                    onChange={handleApplicantChange}
                                    required
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label>Pincode</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="Pincode"
                                    value={newApplicant.Pincode}
                                    onChange={handleApplicantChange}
                                    min="100000"
                                    max="999999"
                                    required
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label>Ownership</Form.Label>
                                <Form.Select
                                    name="Ownership"
                                    value={newApplicant.Ownership}
                                    onChange={handleApplicantChange}
                                    required
                                >
                                    <option value="INDIVIDUAL">INDIVIDUAL</option>
                                    <option value="JOINT">JOINT</option>
                                </Form.Select>
                            </Col>

                            <Col md={6}>
                                <Form.Label>Government ID Type</Form.Label>
                                <Form.Select
                                    name="GovtID_Type"
                                    value={newApplicant.GovtID_Type}
                                    onChange={handleApplicantChange}
                                    required
                                >
                                    <option value="AADHAR">AADHAR</option>
                                    <option value="VOTER_ID">VOTER_ID</option>
                                    <option value="PAN">PAN</option>
                                    <option value="PASSPORT">PASSPORT</option>
                                </Form.Select>
                            </Col>

                            <Col md={6}>
                                <Form.Label>ID Number</Form.Label>
                                <Form.Control
                                    name="ID_Number"
                                    value={newApplicant.ID_Number}
                                    onChange={handleApplicantChange}
                                    required
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label>Category</Form.Label>
                                <Form.Select
                                    name="Category"
                                    value={newApplicant.Category}
                                    onChange={handleApplicantChange}
                                    required
                                >
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                </Form.Select>
                            </Col>
                        </Row>

                        <hr />
                        <h5>Connection Details</h5>

                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Label>Load Applied</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="Load_Applied"
                                    value={newConnection.Load_Applied}
                                    onChange={handleConnectionChange}
                                    min="1"
                                    max="200"
                                    required
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label>Date of Application</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="Date_of_Application"
                                    value={newConnection.Date_of_Application}
                                    onChange={handleConnectionChange}
                                    required
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label>Date of Approval</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="Date_of_Approval"
                                    value={newConnection.Date_of_Approval}
                                    onChange={handleConnectionChange}
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label>Modified Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="Modified_Date"
                                    value={newConnection.Modified_Date}
                                    onChange={handleConnectionChange}
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    name="Status"
                                    value={newConnection.Status}
                                    onChange={handleConnectionChange}
                                    required
                                >
                                    <option value="Connection Released">Connection Released</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Rejected">Rejected</option>
                                </Form.Select>
                            </Col>

                            <Col md={6}>
                                <Form.Label>Reviewer ID</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="Reviewer_ID"
                                    value={newConnection.Reviewer_ID}
                                    onChange={handleConnectionChange}
                                    required
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label>Reviewer Name</Form.Label>
                                <Form.Control
                                    name="Reviewer_Name"
                                    value={newConnection.Reviewer_Name}
                                    onChange={handleConnectionChange}
                                    required
                                />
                            </Col>

                            <Col md={6}>
                                <Form.Label>Reviewer Comments</Form.Label>
                                <Form.Select
                                    name="Reviewer_Comments"
                                    value={newConnection.Reviewer_Comments}
                                    onChange={handleConnectionChange}
                                    required
                                >
                                    <option value="Installation pending">
                                        Installation pending
                                    </option>
                                    <option value="Documents verification in progress">
                                        Documents verification in progress
                                    </option>
                                    <option value="Installation completed">
                                        Installation completed
                                    </option>
                                    <option value="KYC failed">KYC failed</option>
                                </Form.Select>
                            </Col>
                        </Row>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowCreateForm(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="primary"
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Spinner size="sm" animation="border" /> Saving...
                                </>
                            ) : (
                                "Save Applicant"
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
}

export default Home;
